import handler from "./app.js";

export default function leadIntake(req, res) {
  // Forward the request to the combined API with action=chatbot
  req.query = { ...req.query, action: "chatbot" };
  return handler(req, res);
}
