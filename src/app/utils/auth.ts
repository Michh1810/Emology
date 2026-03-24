// Simple authentication utility using localStorage

interface User {
  email: string;
  password: string;
  createdAt: string;
}

const USERS_KEY = "emotion_city_users";
const CURRENT_USER_KEY = "emotion_city_current_user";

export function createAccount(email: string, password: string): { success: boolean; error?: string } {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Validate password
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  // Get existing users
  const users = getUsers();

  // Check if user already exists
  if (users.find((u) => u.email === email)) {
    return { success: false, error: "An account with this email already exists" };
  }

  // Create new user
  const newUser: User = {
    email,
    password, // In a real app, this would be hashed
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Set as current user
  setCurrentUser(email);

  return { success: true };
}

export function login(email: string, password: string): { success: boolean; error?: string } {
  // Validate inputs
  if (!email || !password) {
    return { success: false, error: "Please enter both email and password" };
  }

  // Get existing users
  const users = getUsers();

  // Find user
  const user = users.find((u) => u.email === email);

  if (!user) {
    return { success: false, error: "No account found with this email" };
  }

  if (user.password !== password) {
    return { success: false, error: "Incorrect password" };
  }

  // Set as current user
  setCurrentUser(email);

  return { success: true };
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function deleteUserData(): void {
  // Remove all Emotion City related data
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem("emology_tooltips_completed");
  localStorage.removeItem("emotion_city_user_name");
  localStorage.removeItem("emotion_city_consent_given");
  // Add any other emotion city data keys here if needed
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Helper functions
function getUsers(): User[] {
  const usersJson = localStorage.getItem(USERS_KEY);
  if (!usersJson) return [];
  try {
    return JSON.parse(usersJson);
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(email: string): void {
  localStorage.setItem(CURRENT_USER_KEY, email);
}