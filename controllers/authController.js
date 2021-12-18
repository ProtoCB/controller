const { authenticateAdmin, getAdminToken } = require('../utils/authLogic');
const authRouter = require('express').Router();

authRouter.post('/login', async (req, res, next) => {
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
