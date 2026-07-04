const r=require('express').Router();
const c=require('../controllers/profileController');
const a=require('../middleware/authMiddleware');
const upload = require("../middleware/upload");
r.get('/',a,c.getProfile);
r.put('/',a,c.updateProfile);
r.put('/password',a,c.changePassword);
r.post(
    "/upload",
    a,
    upload.single("profileImage"),
    c.uploadProfileImage
);
r.delete(
    "/",
    a,
    c.deleteAccount
);
module.exports=r;