import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken } from "../auth";
import { logger } from "../utils/logger";

const router = Router();

router.post("/register", async (req, res) => {
  logger.info('Stub register endpoint called');
  
  const user = await storage.getUserByEmail("admin@ecomarket.ru");
  if (!user) {
    return res.status(500).json({ message: "Системный пользователь не найден" });
  }

  const roles = await storage.getUserRoles(user.id);
  const roleNames = roles.map(r => r.role);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isVerified: user.isVerified,
      bonusBalance: user.bonusBalance,
      roles: roleNames,
    },
  });
});

router.post("/login", async (req, res) => {
  logger.info('Stub login endpoint called');
  
  const user = await storage.getUserByEmail("admin@ecomarket.ru");
  if (!user) {
    return res.status(500).json({ message: "Системный пользователь не найден" });
  }

  const roles = await storage.getUserRoles(user.id);
  const roleNames = roles.map(r => r.role);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isVerified: user.isVerified,
      bonusBalance: user.bonusBalance,
      roles: roleNames,
    },
  });
});

router.post("/logout", authenticateToken, async (req, res) => {
  logger.info('Stub logout endpoint called');
  res.json({ message: "Выход выполнен" });
});

router.post("/refresh", async (req, res) => {
  logger.info('Stub refresh endpoint called');
  res.json({ success: true });
});

router.get("/verify-email", async (req, res) => {
  logger.info('Stub verify-email endpoint called');
  res.json({ message: "Email успешно подтверждён" });
});

router.post("/resend-verification", authenticateToken, async (req, res) => {
  logger.info('Stub resend-verification endpoint called');
  res.json({ message: "Письмо для подтверждения отправлено повторно" });
});

router.get("/me", authenticateToken, async (req, res) => {
  const user = await storage.getUser(req.userId!);
  
  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  const roles = await storage.getUserRoles(user.id);
  const roleNames = roles.map(r => r.role);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      phone: user.phone,
      isVerified: user.isVerified,
      bonusBalance: user.bonusBalance,
      roles: roleNames,
    },
  });
});

router.put("/profile", authenticateToken, async (req, res) => {
  logger.info('Stub profile update endpoint called');
  
  const user = await storage.getUser(req.userId!);
  const roles = await storage.getUserRoles(req.userId!);
  const roleNames = roles.map(r => r.role);

  res.json({
    user: {
      id: user!.id,
      email: user!.email,
      firstName: user!.firstName,
      lastName: user!.lastName,
      patronymic: user!.patronymic,
      phone: user!.phone,
      isVerified: user!.isVerified,
      bonusBalance: user!.bonusBalance,
      roles: roleNames,
    },
  });
});

router.put("/password", authenticateToken, async (req, res) => {
  logger.info('Stub password update endpoint called');
  res.json({ 
    message: "Пароль успешно изменён" 
  });
});

router.delete("/account", authenticateToken, async (req, res) => {
  logger.info('Stub account deletion endpoint called');
  res.json({ 
    message: "Аккаунт успешно удалён" 
  });
});

export default router;
