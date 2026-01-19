import { Router } from "express";
import * as authService from "../services/auth.service.js";
import { validate, registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
