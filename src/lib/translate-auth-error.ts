const errorMap: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Veuillez confirmer votre email avant de vous connecter.",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
  "Signup requires a valid password": "Veuillez entrer un mot de passe valide.",
  "Unable to validate email address: invalid format": "Format d'email invalide.",
  "Email rate limit exceeded": "Trop de tentatives. Réessayez dans quelques minutes.",
  "For security purposes, you can only request this once every 60 seconds": "Pour des raisons de sécurité, veuillez patienter 60 secondes avant de réessayer.",
  "New password should be different from the old password.": "Le nouveau mot de passe doit être différent de l'ancien.",
  "Auth session missing!": "Session expirée. Veuillez vous reconnecter.",
  "Token has expired or is invalid": "Le lien a expiré ou est invalide. Veuillez en demander un nouveau.",
};

export function translateAuthError(message: string): string {
  return errorMap[message] || message;
}
