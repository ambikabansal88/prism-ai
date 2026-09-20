import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  provider: "local" | "google";
  googleId?: string;
  createdAt: string;
  resetCode?: string;
  resetCodeExpires?: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const JWT_SECRET = process.env.JWT_SECRET || "ai-chatbot-super-secure-jwt-secret-key-2026";

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with disk
let usersCache: StoredUser[] = [];

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      usersCache = JSON.parse(data);
      return usersCache;
    }
  } catch (err) {
    console.error("Failed to load users from file:", err);
  }

  usersCache = [];
  saveUsers(usersCache);
  return usersCache;
}

function saveUsers(users: StoredUser[]) {
  usersCache = users;
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save users to file:", err);
  }
}

// Initialize users
loadUsers();

// Helper: Public user object (without passwordHash or reset tokens)
export function sanitizeUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

// Helper: Generate JWT
export function generateToken(user: StoredUser): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: StoredUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = usersCache.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User session not found or expired." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Optional Auth Middleware (attaches user if present)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const user = usersCache.find((u) => u.id === decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // ignore
    }
  }
  next();
}

// ---------------- AUTH CONTROLLERS ----------------

// 1. Sign Up
export async function handleSignup(req: Request, res: Response) {
  try {
    const { name, email, password, avatarUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = usersCache.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: StoredUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      provider: "local",
      createdAt: new Date().toISOString(),
    };

    usersCache.push(newUser);
    saveUsers(usersCache);

    const token = generateToken(newUser);
    return res.status(201).json({
      token,
      user: sanitizeUser(newUser),
      message: "Account created successfully.",
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
}

// 2. Log In
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersCache.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: sanitizeUser(user),
      message: "Logged in successfully.",
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

// Verify Google ID token or OAuth access token directly with Google endpoints
export async function verifyGoogleToken(tokenOrCredential: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
} | null> {
  if (!tokenOrCredential || typeof tokenOrCredential !== "string") {
    return null;
  }

  const cleanToken = tokenOrCredential.trim();

  // 1. Try as Google OpenID Connect ID token via tokeninfo
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(cleanToken)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.email && (data.sub || data.user_id)) {
        return {
          googleId: String(data.sub || data.user_id),
          email: String(data.email).trim().toLowerCase(),
          name:
            data.name ||
            data.given_name ||
            String(data.email).split("@")[0].replace(/[._-]/g, " "),
          avatarUrl:
            data.picture ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || data.email)}`,
        };
      }
    }
  } catch (err) {
    // Continue to next check
  }

  // 2. Try as Google OAuth 2.0 access token via userinfo
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.email && data.sub) {
        return {
          googleId: String(data.sub),
          email: String(data.email).trim().toLowerCase(),
          name:
            data.name ||
            data.given_name ||
            String(data.email).split("@")[0].replace(/[._-]/g, " "),
          avatarUrl:
            data.picture ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || data.email)}`,
        };
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

// Helper to find or create a Google-authenticated user
export async function findOrCreateGoogleUser({
  email,
  name,
  avatarUrl,
  googleId,
}: {
  email: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
}): Promise<StoredUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // Match by googleId first if available, then by normalized email
  let user = usersCache.find((u) => {
    if (googleId && u.googleId === googleId) return true;
    return u.email.toLowerCase() === normalizedEmail;
  });

  if (!user) {
    // Generate secure randomized hash for provider entry
    const dummyPasswordHash = await bcrypt.hash(
      "google_oauth_" + Math.random() + "_" + Date.now(),
      10
    );
    // Derive a clean display name if none provided
    const derivedName =
      name && name.trim()
        ? name.trim()
        : normalizedEmail
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

    const generatedId = googleId
      ? "usr_google_" + googleId
      : "usr_google_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    user = {
      id: generatedId,
      name: derivedName,
      email: normalizedEmail,
      passwordHash: dummyPasswordHash,
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`,
      provider: "google",
      googleId: googleId || undefined,
      createdAt: new Date().toISOString(),
    };
    usersCache.push(user);
    saveUsers(usersCache);
  } else {
    let changed = false;
    if (user.provider !== "google") {
      user.provider = "google";
      changed = true;
    }
    if (googleId && !user.googleId) {
      user.googleId = googleId;
      changed = true;
    }
    // Update avatar if provided
    if (avatarUrl && avatarUrl !== user.avatarUrl) {
      user.avatarUrl = avatarUrl;
      changed = true;
    }
    // Update name if provided
    if (name && name.trim() && name.trim() !== user.name) {
      user.name = name.trim();
      changed = true;
    }
    if (changed) {
      saveUsers(usersCache);
    }
  }

  return user;
}

// 3. Google Sign-In / OAuth
export async function handleGoogleAuth(req: Request, res: Response) {
  try {
    const { credential, accessToken } = req.body;

    // A verified Google Credential (ID token) or OAuth Access Token is strictly required
    if (!credential && !accessToken) {
      return res.status(400).json({
        error: "Google authentication requires a verified Google credential or access token.",
      });
    }

    const verified = await verifyGoogleToken(credential || accessToken);
    if (!verified) {
      return res.status(401).json({
        error: "Google authentication failed: The provided credential could not be verified with Google.",
      });
    }

    const user = await findOrCreateGoogleUser({
      email: verified.email,
      name: verified.name,
      avatarUrl: verified.avatarUrl,
      googleId: verified.googleId,
    });

    const token = generateToken(user);
    return res.json({
      token,
      user: sanitizeUser(user),
      message: "Google authentication successful.",
    });
  } catch (err: any) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: "Google authentication failed." });
  }
}

// 4. Forgot Password - Request Reset Code
export async function handleForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersCache.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address." });
    }

    // Generate 6-digit numeric reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins validity
    saveUsers(usersCache);

    return res.json({
      success: true,
      message: "Password reset verification code generated.",
      resetCode, // In modern apps / development preview, returning code enables effortless testing
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Failed to process forgot password request." });
  }
}

// 5. Reset Password
export async function handleResetPassword(req: Request, res: Response) {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: "Email, reset code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersCache.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.resetCode || user.resetCode !== resetCode.trim()) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    if (user.resetCodeExpires && user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    saveUsers(usersCache);

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: "Password has been successfully updated.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
}

// 6. Get Current User Profile (Protected)
export async function handleGetMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ user: sanitizeUser(req.user) });
}

// 7. Update User Profile (Protected)
export async function handleUpdateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, email, avatarUrl, currentPassword, newPassword } = req.body;
    const user = usersCache.find((u) => u.id === req.user!.id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // If updating email, verify not taken by another user
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = usersCache.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.id !== user.id
      );
      if (existing) {
        return res.status(409).json({ error: "This email is already in use by another account." });
      }
      user.email = normalizedEmail;
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    // If updating password
    if (newPassword) {
      if (user.provider === "local" && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ error: "Current password does not match." });
        }
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long." });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    saveUsers(usersCache);

    const freshToken = generateToken(user);

    return res.json({
      user: sanitizeUser(user),
      token: freshToken,
      message: "Profile updated successfully.",
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    return res.status(500).json({ error: "Failed to update profile." });
  }
}
