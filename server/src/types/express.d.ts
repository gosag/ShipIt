declare global {
  namespace Express {
    interface User {
      _id: string;
      email: string;
      name: string;
      avatar?: string;
      googleId?: string;
      username?: string;
    }
  }
}

export {};