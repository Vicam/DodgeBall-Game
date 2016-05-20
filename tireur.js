$(document).on('pageinit', function(){
	$(function() {
		Balls.init();
		/*$( window ).on( "orientationchange", function( event ) {
			location.reload();
		});*/
	}); 

	// fonction gérant les mouvements et actions de la balle
	function Ball(x, y, dx, dy) {

		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		
		this.old_x = x;
		this.old_y = y;   

		var hue = [ 
			 [255,0,0], 
			 [255,255,0], 
			 [0,255,0], 
			 [0,255,255], 
			 [0,0,255], 
			 [255,0,255] 
		 ]; 
		 
		// Bouge la balle en fonction de ses paramètres x, y, dx, dy
		this.move = function() { 
			this.old_x = this.x;
			this.old_y = this.y;		
			this.x += this.dx;
			this.y += this.dy;
		};
		
		// Efface la balle(ctx)
		this.clear = function(ctx) {
			ctx.clearRect(this.old_x-Balls.relativeRadius*1.5, this.old_y-Balls.relativeRadius*1.5, Balls.relativeRadius*3, Balls.relativeRadius*3);
		};
		
		// Dessine la balle(ctx)
		this.draw = function(ctx) {

			// Crée un gradient de couleur
			var grad;
			grad = ctx.createLinearGradient(0,0,1200,1200);
			for(var h = 0; h <hue.length; h++) 
			{ 
				 var color = "rgb("+hue[h][0]+","+hue[h][1]+","+hue[h][2]+")"; 
				 grad.addColorStop(h/6,color); 
			} 
			ctx.beginPath();
			ctx.fillStyle = grad;
			// Crée la balle
			ctx.arc(this.x, this.y, Balls.relativeRadius, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		};
		
		
		// Regarde si la balle sors de l'écran. Si oui retourne la position de sortie (sous forme d'int), sinon renvoie 0
		this.checkBounds = function() {
			var leftX = this.x-Balls.relativeRadius;
			var rightX = this.x+Balls.relativeRadius;
			var topY = this.y-Balls.relativeRadius;
			var bottomY = this.y+Balls.relativeRadius;		

			if(leftX <= 0 && topY <=Balls.heightLeft) 
				return Balls.LEFT;
			if(leftX <= 0 && topY >=Balls.heightLeft) 
				return Balls.LEFTI;
			if(rightX >= Balls.getWidth() && topY <= Balls.heightRight)
				return Balls.RIGHT;
			if(rightX >= Balls.getWidth() && topY >=Balls.heightRight)
				return Balls.RIGHTI;
			if(topY <= 0) 
				return Balls.TOP;
			if(bottomY >= Balls.getHeight())
				return Balls.BOTTOM;
			
			return 0;
		};
		
		// Si la balle sors de l'écran, stocke la valeur de Balls.relativeRadius dans le x ou le y ( si la balle sors à droite ou à gauche ) et met en valeur absolue la vitesse dx ou dy 
		this.actBounds = function() {
			var bound = this.checkBounds();
			/*if(bound == Balls.TOP) {
				this.y = Balls.relativeRadius;
				this.dy = Math.abs(this.dy);
			} else if(bound == Balls.BOTTOM) {
				this.y = Balls.getHeight()-Balls.relativeRadius;
				this.dy = -Math.abs(this.dy);
			}*/if(bound == Balls.RIGHTI) {
				this.x = Balls.getWidth()-Balls.relativeRadius;
				this.dx = -Math.abs(this.dx);
			} else if(bound == Balls.LEFTI){
				this.x = Balls.relativeRadius;
				this.dx = Math.abs(this.dx);
			}else if(bound != 0) {
				Balls.bounceBall(this, this.x, this.y, this.dx, this.dy, bound);				
			}		
		};

	}


	// Contient les Balles
	var Balls = {
		
		// Variables désignant chacune une position différente à partir d'un int (ex : TOP <=> 1)
		TOP : 1,
		RIGHT: 2,
		BOTTOM: 3,
		LEFT : 4,
		RIGHTI :5,	
		LEFTI : 6,

		//radius : 15,
		balls : [],
		

		// Initialise le Terrain
		init : function() {
			console.log("Initialisation-Tireur");
			Balls.zone = $('#zone')[0];
			Balls.initSocket();
			Balls.updateViewport();
			Balls.initBallSpawn();
			window.setInterval(Balls.draw, 1000/50);
			$(window).resize(Balls.updateViewport);
			console.log(WURFL.complete_device_name);
		},
		
		// Change les dimensions et vitesses de la balle en fonction de l'écran
		updateViewport : function() {
			
			// Ajuste les dimentions de l'écran dans le socket en fonction de l'écran
			console.log("MAJ dimensions Tireur");
			var newWidth = $(document).width()-10;
			var newHeight = $(document).height()-10;
			var wHeight;
			var wWidth;
			
			if(WURFL.complete_device_name == "Apple iPhone 5S"){
				wHeight = newHeight/3.88;
				wWidth = newWidth/4.22;
			}
			else if(WURFL.complete_device_name == "Mozilla Firefox") {
				wHeight = newHeight;
				wWidth = newWidth;
			}
			else if(WURFL.complete_device_name == "Apple iPad"){
				wHeight = newHeight/1.438;
				wWidth = newWidth/1.436;
			}
			else{
				wHeight = newHeight/3.88;
				wWidth = newWidth/4.22;
			}
			Balls.socket.emit('tireur-in', {
				'w' : wWidth,
				'h' : wHeight,
				'info' : WURFL.complete_device_name,
			});
				
			// Ajuste la valeur du radius et les dimensions en fonction du type d'écran		
			var radius;
			if(WURFL.complete_device_name == "Apple iPhone 5S"){
				radius = 10*3.88;
			}
			else if(WURFL.complete_device_name == "Mozilla Firefox") {
				radius = 10;
			}
			else if(WURFL.complete_device_name == "Apple iPad"){
				radius = 10*1.438;
			}
			else{
				radius = 38.8;
			}
			Balls.relativeRadius = radius;
			Balls.zone.width = newWidth;
			Balls.zone.height = newHeight;
			
			// Définit la zone par laquelle les balles peuvent sortir de l'écran (en fonction des écrans d'à côté et du type d'écran)
			Balls.socket.on('jeu-out',function(data){
				if(WURFL.complete_device_name == "Apple iPhone 5S"){
					Balls.heightLeft = data.heightLeft*3.88;
					Balls.heightRight = data.heightRight*3.88;
				}else if(WURFL.complete_device_name == "Mozilla Firefox") {
					Balls.heightLeft = data.heightLeft;
					Balls.heightRight = data.heightRight;
				}else if(WURFL.complete_device_name == "Apple iPad"){
					Balls.heightLeft = data.heightLeft*1.438;
					Balls.heightRight = data.heightRight*1.438;
				}
				else{
					Balls.heightLeft = data.heightLeft*3.88;
					Balls.heightRight = data.heightRight*3.88;
				}
			});
			
		},

		
		
		// Initialise le tireur dans le socket
		initSocket : function() {
			console.log('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
			Balls.socket = io.connect('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
		},
		
		// Creer une nouvelle balle en fonction des positions et vitesses du doigt
		initBallSpawn : function() {
			var tempsEntreDeuxTirs = 3000;
			var droitTirer = 1;
			$(Balls.zone).on("vmousedown", function(downEvent) {
				if ( droitTirer != 0 ) {
					$(Balls.zone).on("vmouseup", function(upEvent){
						$(Balls.zone).unbind("vmouseup");
						if(upEvent.clientX-downEvent.clientX==0 || upEvent.clientY-downEvent.clientY==0 ){ 
							var dx = 5;
							var dy = 5;
						}else{
							var dx = (upEvent.clientX-downEvent.clientX)/Balls.getWidth()*25;  
							var dy = (upEvent.clientY-downEvent.clientY)/Balls.getHeight()*25;  
						}
						Balls.spawnBall(upEvent.clientX, upEvent.clientY, dx, dy);
						droitTirer = 0;
						console.log(droitTirer);
						setTimeout(function(){
							droitTirer = 1;
						}, tempsEntreDeuxTirs);
					})
				}
			}); 
		},
		
		// Met à jour les paramètres de la balle (la fait bouger dans le temps)
		draw : function() {
			var ctx = Balls.zone.getContext("2d");
			ctx.clearRect(0, 0, Balls.getWidth(), Balls.getHeight());
			for(var ballIdx in Balls.balls) {
				Balls.balls[ballIdx].draw(ctx);   		
				Balls.balls[ballIdx].move();
				Balls.balls[ballIdx].actBounds();
			}
		},
		
		// Crée une nouvelle Balle en fonction de sa position et vitesse
		spawnBall : function(x, y, dx, dy)	 {
			Balls.balls.push(new Ball(x, y, dx, dy));		
		},
		
		// Envoie au socket que la balle touche le bord de l'écran, avec sa vitesse et position
		bounceBall : function(ball, x, y, dx, dy, bound) {
			var idx = Balls.balls.indexOf(ball);
			Balls.balls.splice(idx, 1);
			
			Balls.socket.emit("ball-tireur-out", {
			'x' : x,
			'y'  : y,
			'dy' : dy,
			'dx' : dx,
			'bound' : bound,
			'info' :WURFL.complete_device_name,

			});
		},

		getWidth : function() { return Balls.zone.width; },
		getHeight : function() { return Balls.zone.height; },
		
	}


});

