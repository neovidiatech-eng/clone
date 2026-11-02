import joi from "joi";

export const updateSettings = {
  body: joi.object({
    paidSessionCount: joi.number().integer().min(0).optional(),
    studentCanJoin: joi.boolean().optional(),
  }).required(),
};

export const updateApplicationStatus = {
  body: joi.object({
    applicationOpen: joi.boolean().strict().required(),
  }).required(),
};

