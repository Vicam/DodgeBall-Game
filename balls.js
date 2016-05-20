//La fonction qui s'exécute au chargement de la page
$(function() {
	console.log("Initialisation-Terrain");
	Balls.zone = $('#zone')[0]; 					// définit la zone du canvas
	Balls.initSocket(); 							// connecte le terrain au socket
	Balls.updateViewport();							// actualise les dimensions de l'écran dans le socket en cas de modiffication
	Balls.initBallSpawn(); 							// charge les balles
	Balls.initPlayers(); 							// charge les joueurs
	
	// Fonction qui se lance quand on lance la partie
	$('#startPartie').click(function(){
		$("#startPartie" ).remove(); 						// retire le bouton pour ne pas géner le jeu
		Balls.socket.emit( 'partieStart'); 					// informe le socket le la partie a commencé
		Balls.init();										// initialise les fonctions qui créent des balles
	});
});	 

var tour = 0;
// fonction gérant les mouvements et actions de la balle
function Joueur(x, y, taille, idx) {
	
	this.x = x;
	this.y = y;
	this.taille = taille;
	this.idx = idx;
}
	
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
		if(topY <= 0) 
			return Balls.TOP;
		else if(bottomY >= Balls.getHeight())
			return Balls.BOTTOM;
		else if(tour==1){
			if(leftX <= 0 && topY <=Balls.heightLeft) 
				return Balls.LEFT;
			if(leftX <= 0 && topY >=Balls.heightLeft) 
				return Balls.LEFTI;
			if(rightX >= Balls.getWidth()/2 && topY <= Balls.heightRight)
				return Balls.RIGHT;
			if(rightX >= Balls.getWidth()/2 && topY >=Balls.heightRight)
				return Balls.RIGHTI;
		}
		else{
			if(leftX <= Balls.getWidth()/2 && topY <=Balls.heightLeft) 
				return Balls.LEFT;
			if(leftX <= Balls.getWidth()/2 && topY >=Balls.heightLeft) 
				return Balls.LEFTI;
			if(rightX >= Balls.getWidth() && topY <= Balls.heightRight)
				return Balls.RIGHT;
			if(rightX >= Balls.getWidth() && topY >=Balls.heightRight)
				return Balls.RIGHTI;			
		}	
		return 0;

	};
	
	// Si la balle sors de l'écran, stocke la valeur de Balls.relativeRadius dans le x ou le y ( si la balle sors à droite ou à gauche ) et met en valeur absolue la vitesse dx ou dy 
	this.actBounds = function() {
		var bound = this.checkBounds();

		if(bound == Balls.TOP) {
			this.dy = Math.abs(this.dy);
		} else if(bound == Balls.BOTTOM) {
			this.dy = -Math.abs(this.dy);
		} else if(bound == Balls.RIGHTI) {
			this.dx = -Math.abs(this.dx);
		} else if(bound == Balls.LEFTI){
			this.dx = Math.abs(this.dx);
		} else if(bound == Balls.LEFT){
			this.dx = Math.abs(this.dx);
		} else if(bound == Balls.RIGHT){
			this.dx = -Math.abs(this.dx);
		}else if(bound != 0) {	
			console.log( "balle perdue" );			
		}
	};
	
	// teste si une balle touche le joueur à un instant
	this.checkTouchTarget = function(mX, mY, tailleJoueur) {

		var XBall = this.x;
		var YBall = this.y;
		var XJoueur = mX + tailleJoueur/2;
		var YJoueur = mY + tailleJoueur/2;
		var tailleTotale = tailleJoueur/2+Balls.relativeRadius;
		if( (Math.abs(XBall-XJoueur)<tailleTotale) && (Math.abs(YBall-YJoueur)<tailleTotale)){
			return true;
		}
		else{
			return false;
		}		
	};
	
	// envoie au serveur que le joueur est touché si le joueur est une cible
	this.actTouchTarget = function() {
		var nbJoueurs = Balls.joueurs.length;
		var isTouching = [];
		for ( var i = 0; i < nbJoueurs; i++) {
			if( Balls.joueursTouches.indexOf(i)==-1 ){
				var idx = Balls.joueurs[i].idx;
				var classi = document.getElementById('cible'+idx).className;			
				if( (classi=='team2' && tour==0) || (classi=='team1' && tour==1) ){						
					var tailleJoueur = Balls.joueurs[i].taille;
					var mX = Balls.joueurs[i].x;
					var mY = Balls.joueurs[i].y;
					isTouching[i] = this.checkTouchTarget(mX, mY, tailleJoueur);
					if ( isTouching[i] == true ) {						
						console.log("Le joueur "+ idx +" est touché");	
						Balls.joueursTouches.push(i);
						Balls.socket.emit('joueur-touché',{
							'idx' : idx,
							'rangi' : i,
						});
					}
				}
			}			
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
	joueurs : [],
	joueursTouches : [],
	

	// Initialise le Terrain
	init : function() {
		/*console.log("Initialisation-Terrain");			// Les fonctions appelées au chargement de la page
		Balls.zone = $('#zone')[0];
		Balls.initSocket();
		Balls.updateViewport();
		Balls.initBallSpawn();
		Balls.initPlayers();*/
		Balls.updatePlayer();								// Modifie le joueur (position, état...)
		window.setInterval(Balls.draw, 1000/50);			// Fait bouger la balle (fréquence d'actualisation d'affichage de la position de la balle dans le temps)
		$(window).resize(Balls.updateViewport);
		console.log(WURFL.complete_device_name);
	},
	
	// Change les dimensions et vitesses de la balle en fonction de l'écran
	updateViewport : function() {
		
		// On définit les tailles à gauche et à droite du terrain (en cas de plusieurs terrains, cette valeur est importante)
		Balls.heightLeft = $(document).height();
		Balls.heightRight = $(document).height();
				
		// Ajuste les dimentions de l'écran dans le socket en fonction de l'écran
		console.log("MAJ dimensions Terrain");
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
		}*/
		
		// Envoie au serveur les nouvelles dimensions du terrain
		Balls.socket.emit('jeu-modif', 
			{
				'w' : newWidth,
				'h' : newHeight,
				'info' : WURFL.complete_device_name,
			});
		
		// Ajuste la valeur du radius et les dimensions en fonction du type d'écran		
		/*var radius;
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
			radius = 10;
		}*/
		Balls.relativeRadius = 10;
		Balls.zone.width = newWidth;
		Balls.zone.height = newHeight;
		
		// Définit la taille des éléments à afficher
		document.getElementById('startPartie').style.left = (newWidth/2)-0.1*newWidth+"px";
		document.getElementById('startPartie').style.top = 0+"px";
		document.getElementById('milieu_terrain').style.width = 10+"px";
		document.getElementById('milieu_terrain').style.height = (newHeight+10)+"px";
		document.getElementById('milieu_terrain').style.left = (newWidth/2)+"px";
		document.getElementById('milieu_terrain').style.top = 0+"px";
		
		// Définit la zone par laquelle les balles peuvent sortir de l'écran (en fonction des écrans d'à côté et du type d'écran)
		/*Balls.socket.on('jeu-out',function(data){
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
		});*/

	},
	
	// Initialise la balle dans le socket
	initSocket : function() {
		console.log('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
		Balls.socket = io.connect('http://'+SERVER_IP+":"+WEBSOCKET_PORT);

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
		Balls.socket.emit('jeu-in', {
			'w' : wWidth,
			'h' : wHeight,
			'info' : WURFL.complete_device_name,
		});
				
		// Dessine la balle quand elle provient d'un autre écran ou fait rebondir sur le rebord
		/*Balls.socket.on("ball-in", function(data) {
			if ( data.bound == Balls.LEFT ) {
				Balls.spawnBall( Balls.relativeRadius, data.y, Math.abs(data.dx), data.dy );
			}
			else if ( data.bound == Balls.RIGHT ) {
				Balls.spawnBall( Balls.getWidth() - Balls.relativeRadius, data.y, -Math.abs(data.dx), data.dy );
			}
			else if ( data.bound == Balls.TOP ) {
				Balls.spawnBall( data.x, Balls.relativeRadius, data.dx, Math.abs(data.dy));
			}
			else if ( data.bound == Balls.BOTTOM ) {
				Balls.spawnBall( data.x, Balls.getHeight() - Balls.relativeRadius, data.dx, -Math.abs(data.dy) );
			}
			else {
				console.log( "balle perdue" );
			}
		});*/
		
		Balls.socket.on("ball-joueur-in", function(data) {
			var tailleJoueur = parseInt( document.getElementById('cible'+data.idx).style.width, 10 );
			var pX = parseInt( document.getElementById('cible'+data.idx).style.left, 10 );
			var pY = parseInt( document.getElementById('cible'+data.idx).style.top, 10 );
			Balls.spawnBall( pX+tailleJoueur/2, pY+tailleJoueur/2, data.dx, data.dy );
		});
	},
	
	// Creer une nouvelle balle en fonction des positions et vitesses de la souris
	initBallSpawn : function() {
		$(Balls.zone).on("vmousedown", function(downEvent) {
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
			})
		});
	},
	
	// Met à jour les paramètres de la balle (la fait bouger dans le temps)
	draw : function() {
		var ctx = Balls.zone.getContext("2d");
		ctx.clearRect(0, 0, Balls.getWidth(), Balls.getHeight());
		for(var ballIdx in Balls.balls) {
			Balls.balls[ballIdx].draw(ctx);   		
			Balls.balls[ballIdx].move();
			Balls.balls[ballIdx].actTouchTarget();
			Balls.balls[ballIdx].actBounds();
		}

	},
	
	// Crée une nouvelle Balle en fonction de sa position et vitesse
	spawnBall : function(x, y, dx, dy)	 {
		Balls.balls.push(new Ball(x, y, dx, dy));		
	},
	
	// Envoie au socket que la balle touche le bord de l'écran, avec sa vitesse et position
	/*bounceBall : function(ball, x, y, dx, dy, bound) {
		var idx = Balls.balls.indexOf(ball);
		Balls.balls.splice(idx, 1);

		Balls.socket.emit("ball-out", {
			'y'  : y,
			'dy' : dy,
			'dx' : dx,
			'bound' : bound,
			'info' :WURFL.complete_device_name,
		});
	},*/

	getWidth : function() { return Balls.zone.width; },
	getHeight : function() { return Balls.zone.height; },
	
	
	// Connecte le joueur au socket
	initPlayers : function() {
		Balls.socket.on('joueur-in', function(data){
			var idc = data.idx;
			var positionXDepart=0;
			if(data.team == '1'){
				positionXDepart = $(document).width()/4;
			}
			else{
				positionXDepart = $(document).width()*(3/4);
			}
			if(data.team==1){
				
			}
			$( document.getElementById('joueurs') ).append("<div id='div"+idc+"'></div>");
			$( document.getElementById('div'+idc) ).append("<img src='/ressources/joueur"+(idc+1)+".png' id='cible"+idc+"' class='team"+data.team+"' style='top:"+($(document).height()/2)+"px; left:"+positionXDepart+"px; width:40px; height:40px; position:absolute'>");

			var x = positionXDepart;
			var y = $(document).height()/2;
			Balls.joueurs.push(new Joueur(x, y, 40, idc));
		});
	},
	
	// Met à jour la position du joueur
	updatePlayer : function() {
		
		Balls.socket.on('joueur-move', function(data){
			move.defaults = {
			  duration: 100
			};
			var tailleJoueur = parseInt( document.getElementById('cible'+data.idx).style.width, 10 );
			var pX = parseInt( document.getElementById('cible'+data.idx).style.left, 10 );
			var pY = parseInt( document.getElementById('cible'+data.idx).style.top, 10 );
			var pclass = document.getElementById('cible'+data.idx).className;
			var pC = ($(document).width()-10)/2;
			var mX = (data.positionX )/2;
			var mY = (data.positionY )/2;
			
			var pbX = "non";
			var pbY = "non";
			
			if( (pclass == 'team1' && pX+mX + tailleJoueur > pC) || (pclass == 'team2' && pX+mX-10 < pC) || (pX+mX + tailleJoueur > $(document).width()) || (pY+mY + tailleJoueur > $(document).height()) || (pX+mX < 0) || (pY+mY < 0) ){
				if(pclass == 'team1' && pX+mX > pC-tailleJoueur){
					pbX = (pC-tailleJoueur)+"px";
				}
				if(pclass == 'team2' && pX+mX-10 < pC){
					pbX = pC+10+"px";
				}
				if(pX+mX > $(document).width()-tailleJoueur){
					pbX = ($(document).width()-tailleJoueur)+"px";
				}
				if(pY+mY > $(document).height()-tailleJoueur){
					pbY = ($(document).height()-tailleJoueur)+"px";
				}
				if(pX+mX < 0){
					pbX = 0+"px";
				}
				if(pY+mY < 0){
					pbY = 0+"px";
				}			
			}
			if( pbX!="non" || pbY!="non"){
				if(pbX!="non"){
					document.getElementById('cible'+data.idx).style.left = pbX;					
				}
				else{
					move('#cible'+data.idx)		
					.sub('left', -mX )
					.ease('out')
					.end();
				}
				if(pbY!="non"){
					document.getElementById('cible'+data.idx).style.top = pbY;					
				}
				else{
					move('#cible'+data.idx)		
					.sub('top', -mY )
					.ease('out')
					.end();
				}
			}
			else{
				move('#cible'+data.idx)		
				.sub('left', -mX )
				.sub('top', -mY )
				.ease('out')
				.end();
			}
			var rangi = -1;
			for(var i=0; i<Balls.joueurs.length; i++){
				if( Balls.joueurs[i].idx == data.idx ){
					rangi = i;
				}
			}
			if(rangi != -1){
				Balls.joueurs[rangi].x = parseInt( document.getElementById('cible'+data.idx).style.left, 10);
				Balls.joueurs[rangi].y = parseInt( document.getElementById('cible'+data.idx).style.top, 10);
				Balls.joueurs[rangi].taille = tailleJoueur;		
			}				
		});
		
		// Retire le joueur du terrain quand le serveur le lui dit
		Balls.socket.on('joueur-out', function(data){
			var i=0;
			var trouve = false;
			while( i<Balls.joueurs.length && trouve==false){
				if(Balls.joueurs[i].idx==data.idx){
					trouve = true;
				}
				else{
					i++
				}
			}
			Balls.joueurs.splice(i, 1);
			//Balls.joueursTouches.splice(i, 1);
			var element = document.getElementById("div"+data.idx);
			element.parentNode.removeChild(element);
		});
		
		/*Balls.socket.on('touché', function(data){
			Balls.joueurs.splice(data.rangi, 1);
			Balls.joueursTouches.splice(data.rangi, 1);			
		});*/
		
		// Si une erreur s'est faite, le terrain ne considère plus le joueur comme touché
		Balls.socket.on('non-touché', function(data){
			Balls.joueursTouches.splice(data.rangi, 1);		
		});
		
		Balls.socket.on('changement-tour', function(data){
			Balls.joueursTouches = [];
			Balls.balls = [];
			tour = data.tour;
		});
		
		Balls.socket.on('initialisation-tour', function(data){
			tour = data.tour;
		});
		
	},

}
