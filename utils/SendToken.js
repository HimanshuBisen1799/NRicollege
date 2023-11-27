exports.sendtoken = (user,statusCode, res) =>{
    const token = user.getjwttoken();
  
    const opitions = {
      expire : new Date(
          Date.now() + 1*24*60*60*1000
      ),
      httpOnly : true,
      // secure : true,
    } ;
    
    res.status(statusCode)
    .cookie("token",token,opitions)
    .json({success:true, id:user._id, token});
  }