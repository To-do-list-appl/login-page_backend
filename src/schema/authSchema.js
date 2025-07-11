const joi = require('joi');

const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).max(128).required()
});

const registerSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required().min(6).max(128),
  confirmPassword: joi.string().required().min(6).max(128),
});

module.exports = { loginSchema, registerSchema };