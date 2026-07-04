const mongoose=require('mongoose');module.exports=mongoose.model('User',new mongoose.Schema({name:String,email:{type:String,unique:true},password:String,role:{type:String,default:'user'},location:String,address:String,phone:String,bio:String,
    profileImage: {
    type: String,
    default: ""
},skills:[String]},{timestamps:true}));