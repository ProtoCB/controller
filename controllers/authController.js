const { authenticateAdmin, getAdminToken, authenticateAgent, getAgentToken } = require('../utils/authLogic');
const authRouter = require('express').Router();
const middleware = require('../utils/middleware');

authRouter.post('/admin/login', middleware.requestLogger, async (req, res, next) => {
  try{
    authenticateAdmin(req.body.username, req.body.password);
    const token = getAdminToken(req.body.username);
    res.send({
      token
    });
  }
  catch(err){
    next(err);
  }
});

module.exports = authRouter;
