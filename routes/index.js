var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User   = require('../models/user.js');
var Post   = require('../models/post.js');
//var hello = express.Router();
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// router.get('/hello',function(req,res,next){
// 	res.send("The time is " + new Date().toString());
// });

//module.exports = hello;
router.get('/',function(req,res){
	Post.get(null,function(err,posts){
		 if (err) {
		 	posts = [];
		 }
		 res.render('index',{title:'Cyberpunk',posts:posts,});

	});
	
});
router.get('/u/:user',function(req,res){
	User.get(req.params.user,function(err,user){
		if (!user) {
			req.flash('error','用户名不存在');
			return res.redirect('/');
		}
		Post.get(user.name,function(err,posts){
			if (err) {
				req.flash('error', err); 
				return res.redirect('/');
			}
			res.render('user', {
            	title: user.name,
            	posts: posts,
          	});
		});
	});
});
router.post('/post',checkLogin);
router.post('/post',function(req,res){
	var currentUser = req.session.user;
	var post = new Post(currentUser.name,req.body.post);
	console.log(post);
	post.save(function(err){
		if (err) {
			req.flash('error',err);
			return res.redirect('/');
		}
		req.flash('success','发表成功');
		res.redirect('/u/'+currentUser.name);

	});
});
router.get('/reg',checkNotLogin);
router.get('/reg',function(req,res){
	res.render('reg',{
		title:'用户注册',
	});
});
router.post('/reg',checkNotLogin);
router.post('/reg',function(req,res){
	//校验用户两次输入的口令是否一致
	if(req.body['password-repeat'] != req.body['password'] ){
		req.flash('error','两次口令输入不一致');
		return res.redirect('/reg');
		//应该是重新定位到注册页面，即刷新
	}

	//生产口令的散列值
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');

	var newUser = new User({
		name : req.body.username,
		password : password

	});

	//检查用户名是否存在
	User.get(newUser.name,function(err,user){
		if(user){
			err = '用户名已存在';
		}
		if(err){
			req.flash('error',err);
			return res.redirect('/reg');

		}
		//用户名唯一、口令一致（以后应该还会检查用户名规范和口令强度）
		//新增该用户名
		newUser.save(function(err){
			if (err) {
				req.flash('error',err);
				return res.redirect('/reg');
			}
			req.session.user = newUser;
			req.flash('success','注册成功');
			res.redirect('/');
		});

	});

});

router.get('/login',checkNotLogin);
router.get('/login',function(req,res){
	res.render('login',{
		title : '用户登录'
	});
});
router.post('/login',checkNotLogin);
router.post('/login',function(req,res){
	//根据密码生成MD5校验码
	var md5 = crypto.createHash('md5');
	var password = md5.update(req.body.password).digest('base64');

	User.get(req.body.username,function(err,user){
		if(!user){
			req.flash('error','用户名不存在');
			return res.redirect('/login');
		}
		if(user.password!= password){
			req.flash('error','口令错误！');
			return res.redirect('/login');
		}
		req.session.user = user;
		req.flash('success','登录成功');
		res.redirect('/');
	});


});
router.get('/loginout',checkLogin);
router.get('/logout',function(req,res){
	req.session.user = null;
	req.flash('success','登出成功');
	res.redirect('/');
});
function checkNotLogin(req,res,next){
	if(req.session.user){
		req.flash('error','已登录');
		res.redirect('/');
	}
	next();
}
function checkLogin(req,res,next){
	if(!req.session.user){
		req.flash('error','未登录');
		res.redirect('/login');
	}
	next();
}
module.exports = router;



