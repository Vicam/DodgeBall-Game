// Fonction qui se lance au chargement de la page
$(function(e) {
	Jeu.init();
}); 



var Jeu = {
	
	tourActuel : 'cible',	
	nombreDeTirsAutorises : 1,
		
	init : function() {
		Jeu.initSocket();						// Connecte le joueur au socket
		ModeTireur.zone = $('#zone')[0];		// Définit la taille de la zone où on peut envoyer des balles
		Jeu.updateViewport();					// Change l'état du joueur en fonction du déroulement du jeu
		Jeu.initPartieStart();					// Charge les fonctions permettant de se déplacer et d'envoyer des balles une fois la partie commencée
	},
	
	// est chargée au chargement de la page par Jeu.init(), mais ne réagit que quand le serveur annonce que la partie a commencé
	initPartieStart : function(data) {
		Jeu.socket.on('partieStart', function (data) {
			console.log(WURFL.complete_device_name);
			console.log("Initialisation-Joueur");
			document.getElementById('numero').src = "ressources/joueur"+(data.idx+1)+".png";		//Affiche le numéro du joueur en bas de son écran
			document.getElementById('numero').style.top = ($(document).height()-40)+"px";
			Jeu.updateTour();	// Modifie le rôle du joueur quand le serveur le lui dit
			setTimeout(function(){		// Charge les fonctions du mode tireur et cible une fois que le reste a été chargé
				ModeTireur.init();
				ModeCible.init();			
			}, 500);
		});
		
	},
	
	// Connecte le joueur au socket
	initSocket : function() {
		console.log('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
		Jeu.socket = io.connect('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
	},
	
	// Change l'état du joueur
	updateViewport : function() {
		
		// Ajuste les dimentions de l'écran dans le socket en fonction de l'écran
		console.log("MAJ dimensions Joueur");
		var newWidth = $(document).width()-10;
		var newHeight = $(document).height()-10;
		/*var wHeight;
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
			radius = 12;
		}*/
		ModeTireur.relativeRadius = 15;
		ModeTireur.zone.width = newWidth;
		ModeTireur.zone.height = newHeight;
		
		// Définit la zone par laquelle les balles peuvent sortir de l'écran (en fonction des écrans d'à côté et du type d'écran)
		/*Jeu.socket.on('jeu-out',function(data){
			if(WURFL.complete_device_name == "Apple iPhone 5S"){
				ModeTireur.heightLeft = data.heightLeft*3.88;
				ModeTireur.heightRight = data.heightRight*3.88;
			}else if(WURFL.complete_device_name == "Mozilla Firefox") {
				ModeTireur.heightLeft = data.heightLeft;
				ModeTireur.heightRight = data.heightRight;
			}else if(WURFL.complete_device_name == "Apple iPad"){
				ModeTireur.heightLeft = data.heightLeft*1.438;
				ModeTireur.heightRight = data.heightRight*1.438;
			}
			else{
				ModeTireur.heightLeft = data.heightLeft*3.88;
				ModeTireur.heightRight = data.heightRight*3.88;
			}
		});*/
		
		// fonctione permettant d'aller chercher les valeurs dans l'URL
		function $_GET(param) {
			var vars = {};
			window.location.href.replace( location.hash, '' ).replace( 
				/[?&]+([^=&]+)=?([^&]*)?/gi,
				function( m, key, value ) {
					vars[key] = value !== undefined ? value : '';
				}
			);

			if ( param ) {
				return vars[param] ? vars[param] : null;	
			}
			return vars;
		}
		var equipe = decodeURI( $_GET( 'equipe' ) );
		
		// Envoie au serveur que les inforations du joueur
		Jeu.socket.emit('joueur-in', {
			'info' : WURFL.complete_device_name,
			'equipe' : equipe,
		});
		
		// Change de page une fois touché
		Jeu.socket.on('touché', function(data){
			if(Jeu.tourActuel=='cible'){
				/*Jeu.socket.emit("joueur-confirme-touche", {
					'rangi': data.rangi,
				});	*/
				document.location.href = 'touche.html';
			}
			else{
				Jeu.socket.emit("joueur-non-touche", {
					'rangi': data.rangi,
				});	
			}	
		});
		
		// Change de page une fois avoir gagné
		Jeu.socket.on('gagné', function(){
			document.location.href = 'gagne.html';
		});
	},
	
	// Change le rôle du joueur quand le serveur le dit
	updateTour : function() {
		Jeu.socket.on('tour', function(data){
			Jeu.tourActuel=data.tour;
			Jeu.updateRole();
		});
		Jeu.socket.on('changement-tour', function(){
			ModeTireur.balls = [];
			if(Jeu.tourActuel=='tireur'){
				Jeu.tourActuel='cible';
			}
			else{
				Jeu.nombreDeTirsAutorises++;
				Jeu.tourActuel='tireur';
				ModeTireur.nombreDeTirs = Jeu.nombreDeTirsAutorises;
			}
			Jeu.updateRole();
		});
	},
	
	// Affiche les bonnes images sur l'écran du joueur en fonction de son rôle
	updateRole : function() {
		if(Jeu.tourActuel == 'tireur'){
			document.getElementById('centerTarget').style.visibility = "hidden";
			document.getElementById('cible').style.visibility = "hidden";
			document.getElementById('tireur').style.visibility = "visible";
		}
		else{
			document.getElementById('centerTarget').style.visibility = "visible";
			document.getElementById('cible').style.visibility = "visible";
			document.getElementById('tireur').style.visibility = "hidden";
		}
	},
}

// Fonctionnalités en mode cible
var ModeCible = {
	
	nombreDeTirs : 1,
	
	centerX : function() { return $(document).width()/2-5; },
	centerY : function() { return $(document).height()/2-5; },
	
	// Fonction appelée quand on veut charger les fonctionnalités
	init : function(e) {
		ModeCible.placerCenter();
		ModeCible.updateMouse(e);
	},
	
	// Place les images à la bonne position sur l'écran du joueur
	placerCenter : function() {
		document.getElementById('centerTarget').style.width = this.centerX()/2+"px";
		document.getElementById('cible').style.width = $(document).width()+"px";
		document.getElementById('tireur').style.width = $(document).width()+"px";
		
		document.getElementById('centerTarget').style.height = this.centerX()/2+"px";
		document.getElementById('cible').style.height = $(document).height()+"px";
		document.getElementById('tireur').style.height = $(document).height()+"px";

		
		var leftX = this.centerX()-this.centerX()/4;
		var topY = this.centerY() - this.centerX()/4;
		document.getElementById('centerTarget').style.left = leftX+"px";
		document.getElementById('cible').style.left = 0+"px";
		document.getElementById('tireur').style.left = 0+"px";
		
		document.getElementById('centerTarget').style.top = topY+"px";
		document.getElementById('cible').style.top = 0+"px";
		document.getElementById('tireur').style.top = 0+"px";
	},
	
	mouse_down : false,
	mouseX : 0,
	mouseY : 0,
	
	// Charge les positions de la souris dans le temps
	updateMouse : function(e) {
		$( document ).on ( "vmouseup", function(e){
			if(Jeu.tourActuel=='cible'){
				ModeCible.mouse_down=false	
			}			
		});
			
		$( document ).on ( "vmousedown", function(e){
			if(Jeu.tourActuel=='cible'){
				ModeCible.mouse_down=true;
				var tempX = e.pageX;
				var tempY = e.pageY;

				if (tempX < 0){tempX = 0;}
				if (tempY < 0){tempY = 0;}  
				ModeCible.mouseX = tempX;
				ModeCible.mouseY = tempY;
				ModeCible.updatePosition(e);
			}
			else{
				ModeCible.mouse_down=false;
			}
		});
		
		$( document ).on ( "vmousemove", function(e){
			if(Jeu.tourActuel=='cible'){
				var tempX = e.pageX;
				var tempY = e.pageY;

				if (tempX < 0){tempX = 0;}
				if (tempY < 0){tempY = 0;}  
				ModeCible.mouseX = tempX;
				ModeCible.mouseY = tempY;
			}
			else{
				ModeCible.mouse_down=false;
			}
		});
		
		
	},

	// Envoie au serveur les déplacements du joueur
	updatePosition : function(e) {		
		if (ModeCible.mouse_down === true) {
			var positioX = ModeCible.mouseX;
			var positioY = ModeCible.mouseY;
			var resX = positioX - ModeCible.centerX();
			var resY = positioY - ModeCible.centerY();
			if(resX>50){
				resX=50;
			}
			if(resY>50){
				resY=50;
			}
			if(resX<-50){
				resX=-50;
			}
			if(resY<-50){
				resY=-50;
			}
			
			Jeu.socket.emit('position-change', {
				'positionX' : resX,
				'positionY' : resY,
			});
			setTimeout( function(){
				if (ModeCible.mouse_down === true) {
					ModeCible.updatePosition(e);
				}
			}, 50);
		}
			
	}	
	
}

// Fonctiones générales permettant d'afficher, faire bouger, supprimer des balles
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
		ctx.clearRect(this.old_x-ModeTireur.relativeRadius*1.5, this.old_y-ModeTireur.relativeRadius*1.5, ModeTireur.relativeRadius*3, ModeTireur.relativeRadius*3);
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
		ctx.arc(this.x, this.y, ModeTireur.relativeRadius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	};
	
	
	// Regarde si la balle sors de l'écran. Si oui retourne la position de sortie (sous forme d'int), sinon renvoie 0
	this.checkBounds = function() {
		var leftX = this.x-ModeTireur.relativeRadius;
		var rightX = this.x+ModeTireur.relativeRadius;
		var topY = this.y-ModeTireur.relativeRadius;
		var bottomY = this.y+ModeTireur.relativeRadius;		

		if(leftX <= 0 || rightX >= ModeTireur.getWidth() || topY <= 0 || bottomY >= ModeTireur.getHeight() ){
			return ModeTireur.LEFT;
		}
		else{
			return 0;
		}		
	};
	
	// Si la balle sors de l'écran, stocke la valeur de ModeTireur.relativeRadius dans le x ou le y ( si la balle sors à droite ou à gauche ) et met en valeur absolue la vitesse dx ou dy 
	this.actBounds = function() {
		var bound = this.checkBounds();
		if(bound != 0) {
			ModeTireur.bounceBall(this, this.dx, this.dy);				
		}		
	};

}


// Fonctionnalités du mode tireur
var ModeTireur = {
	
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
		ModeTireur.initBallspawn();
		window.setInterval(ModeTireur.draw, 1000/50);
		$(window).resize(ModeTireur.updateViewport);
	},
	
	// Creer une nouvelle balle en fonction des positions et vitesses du doigt
	initBallspawn : function() {
		$(ModeTireur.zone).on("vmousedown", function(downEvent) {
			if ( ModeTireur.nombreDeTirs > 0 ){
				$(ModeTireur.zone).on("vmouseup", function(upEvent){
					$(ModeTireur.zone).unbind("vmouseup");
					if(Jeu.tourActuel=='tireur'){					
						if(upEvent.clientX-downEvent.clientX==0 || upEvent.clientY-downEvent.clientY==0 ){ 
							var dx = 5;
							var dy = 5;
						}else{
							var dx = (upEvent.clientX-downEvent.clientX)/ModeTireur.getWidth()*25;  
							var dy = (upEvent.clientY-downEvent.clientY)/ModeTireur.getHeight()*25;  
						}
						ModeTireur.spawnBall(upEvent.clientX, upEvent.clientY, dx, dy);
						ModeTireur.nombreDeTirs--;
					}
				});
			}
		}); 	
	},
	
	// Met à jour les paramètres de la balle (la fait bouger dans le temps)
	draw : function() {		
		var ctx = ModeTireur.zone.getContext("2d");
		ctx.clearRect(0, 0, ModeTireur.getWidth(), ModeTireur.getHeight());
		for(var ballIdx in ModeTireur.balls) {
			ModeTireur.balls[ballIdx].draw(ctx);   		
			ModeTireur.balls[ballIdx].move();
			ModeTireur.balls[ballIdx].actBounds();
		}		
	},
	
	// Crée une nouvelle Balle en fonction de sa position et vitesse
	spawnBall : function(x, y, dx, dy)	 {
		ModeTireur.balls.push(new Ball(x, y, dx, dy));						
	},
	
	// Envoie au socket que la balle touche le bord de l'écran, avec sa vitesse et position
	bounceBall : function(ball, dx, dy) {		
		var idx = ModeTireur.balls.indexOf(ball);
		ModeTireur.balls.splice(idx, 1);
		
		Jeu.socket.emit("ball-joueur-out", {
			'dy' : dy,
			'dx' : dx,
		});	
	},

	getWidth : function() { return ModeTireur.zone.width; },
	getHeight : function() { return ModeTireur.zone.height; },
	
}

