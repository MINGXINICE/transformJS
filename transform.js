//工具类
(function(w){
	w.css=function (obj,name,value){
			
			if(!obj.transform){
					obj.transform={};
				}
			
			if(arguments.length>2){
				var result = "";
				obj.transform[name]=value;
				for(item in obj.transform){
					//for in 会遍历原型链
					switch (item){
						case "rotate":
						case "skewX":
						case "skewY":
						case "skew":
							result +=item+"("+obj.transform[item]+"deg) ";
							break;
							
						case "translateX":
						case "translateY":
						case "translateZ":
						case "translate":
							result +=item+"("+obj.transform[item]+"px) ";
							break;
							
						case "scale":
						case "scaleX":
						case "scaleY":
							result +=item+"("+obj.transform[item]+") ";
							break;
					}
					
				}
				obj.style.WebkitTransform=obj.style.transform=result;
				
			}else if(arguments.length==2){
				value = obj.transform[name];
				
				if(typeof value == "undefined"){
					if(name=="scale"||name=="scaleX"||name=="scaleY"){
						return 1;
					}else{
						return 0;
					}
				}
				
				return value;
			}
		}
	
	
	//抽象我们整个双指事件
	w.gesTure=function (node,callback){
		var flag = false;
		var start={};
		node.addEventListener("touchstart",function(ev){
			flag=true;
			var touch = ev.touches;
			start.angle=getAngle(touch[0],touch[1]);
			start.scale=getR(touch[0],touch[1]);
			if(touch.length>=2){
				if(callback&&callback["start"]){
					callback["start"].call(node,ev);
				}
			}
		})
		
		node.addEventListener("touchmove",function(ev){
			var touch = ev.touches;
			var angle = getAngle(touch[0],touch[1]);
			var scale = getR(touch[0],touch[1]);
			ev.rotation=angle - start.angle;
			ev.scale=scale/start.scale;
			if(touch.length>=2){
				if(callback&&callback["change"]){
					callback["change"].call(node,ev);
				}
			}
		})
		
		node.addEventListener("touchend",function(ev){
			if(flag){
				if(callback&&callback["end"]){
					callback["end"].call(node,ev);
				}
				flag=false;
			}
		})
	}
	//获取两个点之间的距离
	w.getR=function (p1,p2){
		var y = p1.clientY - p2.clientY;
		var x = p1.clientX - p2.clientX;
		var dis = Math.sqrt(y*y+x*x);
		return dis;
	}
	//获取双指与x轴之间角度
	w.getAngle=function (p1,p2){
		var y = p1.clientY - p2.clientY;
		var x = p1.clientX - p2.clientX;
		var angle=Math.atan2(y,x)*180/Math.PI;
		return angle;
	}
	
	
	
	//带快速滑屏的竖向滑屏（即点即停版,带滚动条,防抖动,兼容dom结构）
	w.drag=function (wrap,index,callBack){
//			var wrap = document.querySelector("#wrap");
//			var child = document.querySelector("#inner");
			//firstChild lastChild 
			var child = wrap.children[index];//剔除文本结点
			css(child,"translateZ",0.01);
			var minY = wrap.clientHeight - child.offsetHeight;
			
//			var startY = 0;
			var start={};
			var elementY = 0;
			//橡皮筋系数
			var ratio = 1;
			
			
	//				上一次的位置
			var lastPoint =0;
	//				上一次的时间
			var lastTime = 0;
	//				时间差   不能为0 一旦为0 第一次点击的时候，会出bug
			var timeV = 1;
	//				位置差
			var pointV =0;
	//				Tween
			var Tween = {
				//模拟我们的transtion的贝塞尔去实现回弹
				easeOut: function(t,b,c,d,s){
		            if (s == undefined) s = 1.70158;
		            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		        },
				
				//模拟transtion的线性
				Linear: function(t,b,c,d){ return c*t/d + b; },
			}
			
			//防抖动
			var isY = true;
			var isFirst=true;
			
			
			wrap.addEventListener("touchstart",function(ev){
				//兼容dom结构
				minY = wrap.clientHeight - child.offsetHeight;
	//					解决速度的残留
				pointV =0;
				timeV = 1;
				child.style.transition="none";
				
				var touch = ev.changedTouches[0];
//				startY = touch.clientY;
				start = {clientX:touch.clientX,clientY:touch.clientY};
				elementY = css(child,"translateY");
				
				lastPoint = start.clientY;
				lastTime = new Date().getTime();
				
				clearInterval(wrap.clear);
				
				//外部的touchstart逻辑
				if(callBack&&callBack["start"]){
					callBack["start"]();
				}
				
				isY = true;
				isFirst=true;
			})
			
			
			//即点即停跟我们的touchmove没有半毛钱关系
			wrap.addEventListener("touchmove",function(ev){
				if(!isY){
					return;
				}
				var touch = ev.changedTouches[0];
//				var nowY = touch.clientY;
				var now = touch;
//				var dis = nowY - startY;
				var disX = now.clientX-start.clientX;
				var disY = now.clientY-start.clientY;
				
				if(isFirst){
					isFirst=false;
					if(Math.abs(disX)>Math.abs(disY)){
						isY=false;
						//禁止单次逻辑时的抖动
						return;
					}
				}
				
				var translateY=elementY+disY;
				//只有超出的时候，才存在橡皮筋效果
	//					if(translateY>0){
	//						//随着ul移动距离越来越大，整个ul移动距离的增幅越来越小
	//						ratio = 0.6-translateY/(document.documentElement.clientHeight*3);
	//						translateY=translateY*ratio;
	//					}else if(translateY<minY){
	//						//右边的留白（正值）
	//						var over = minY - translateY;
	//						ratio = 0.6-over/(document.documentElement.clientHeight*3);
	//						translateY=minY-(over*ratio);
	//					}
				if(translateY>0){
					//随着ul移动距离越来越大，整个ul移动距离的增幅越来越小
					ratio = document.documentElement.clientHeight/((document.documentElement.clientHeight+translateY)*1.8);
					translateY=translateY*ratio;
				}else if(translateY<minY){
					//右边的留白（正值）
					var over = minY - translateY;
					ratio = document.documentElement.clientHeight/((document.documentElement.clientHeight+over)*1.8);
					translateY=minY-(over*ratio);
				}
				
				var nowTime = new Date().getTime();
				var nowPoint = now.clientY;;
				pointV = nowPoint - lastPoint;
				timeV = nowTime - lastTime;
				lastPoint = nowPoint;
				lastTime = nowTime;
				
	//					console.log(timeV+" : "+pointV);
				css(child,"translateY",translateY);
				
				//外部的touchmove逻辑
				if(callBack&&callBack["move"]){
					callBack["move"]();
				}
			})
			
			wrap.addEventListener("touchend",function(){
				var speed = pointV/timeV;
				var addY = speed*200;
				var target= css(child,"translateY")+addY;
//				var bessel ="";
				var type="Linear";
				var time =0;
				time = Math.abs(speed)*0.3;
				time =time<0.3?0.3:time;
				
				if(target>0){
					target=0;
//					bessel="cubic-bezier(.65,1.49,.63,1.54)";
					type="easeOut";
				}else if(target<minY){
					target = minY;
//					bessel="cubic-bezier(.65,1.49,.63,1.54)";
					type="easeOut";
				}
				
				
//				child.style.transition=time*10+"s "+bessel;
//				console.log(target);
//				css(child,"translateY",target);
				//抽象整个过渡过程
				move(target,time,type);
				
				//外部的touchend逻辑
				if(callBack&&callBack["end"]){
					callBack["end"]();
				}
			})
			
			//move函数用来抽象整个自动滑屏的过程  ！！！怎么模拟transtion
			function move (target,time,type){
				//		t :当前次数(t从1开始)
				//		b :初始位置
				//		c :目标位置与初始位置之间的差值
				//		d :总次数
				//		s :一般我们不改,它用来抽象回弹距离
				var t=0;
				var b=css(child,"translateY");
				var c=target-b;
				var d=time/0.01;
				
				
				//开启循环定时器之前必须清除这个定时器
				//避免重复开启逻辑一样的定时器
				clearInterval(wrap.clear);
				wrap.clear=setInterval(function(){
					t++;
					if(t>d){
						clearInterval(wrap.clear);
						
						//外部的滑屏结束逻辑
						if(callBack&&callBack["over"]){
							callBack["over"]();
						}
					}else{
						//如果直接触发touchstart和end  你们这个代码块里的逻辑会被执行300ms
						
						//Tween算法给我们提供了每一帧具体的位置;
						var dis = Tween[type](t,b,c,d);
						//每一帧的运动  dis：每一帧的位置！！！由Twenn算法来提供
						//每一帧的运动本质上没有消耗时间，而是登录20毫秒之后去触发队列里的下一个定时器
						css(child,"translateY",dis);
						if(callBack&&callBack["move"]){
							callBack["move"]();
						}
					}
				},10);
			}
		}

}
)(window)
