require("./config.js");
var connect = require('connect');
var io = require("socket.io").listen(WEBSOCKET_PORT);

var clients = [];	//les écrans ayant le rôle de terrain
var w = [];
var h = [];
var info =[];

var joueurs = [];	//les écrans ayant le rôle de joueur
var j_info =[];
var j_equipe =[];

var visiteurs = []; //les visiteurs sur la page du menu

var tour = Math.floor(Math.random() * 2); // On définit les rôles des joueurs en début de partie à l'aide d'un random (0 ou 1)
var partieStarted = false;                // Passe à true une fois la partie commencée

/*setInterval(function(){
	if(tour==0){
		tour = 1;
	}
	else{
		tour = 0;
	}
	for(var i=0; i<clients.length; i++){
		clients[i].emit("changement-tour", {
			'tour' : tour,
		});
	}
	for(var i=0; i<joueurs.length; i++){
		if(joueurs[i]!='disconnected'){
			joueurs[i].emit("changement-tour");
		}
	}
	
}, 10000)*/

// Variables désignant chacune une position différente à partir d'un int (ex : TOP <=> 1)
var Balls = {
	TOP : 1,
	RIGHT: 2,
	BOTTOM: 3,
	LEFT : 4,
	RIGHTI : 5,	
	LEFTI : 6,
};

// rend l'idx du joueur en fonction de rangi du terrain
function idxjoueur(rangi){
	var res;
	var rang=0;
	var nbCo=0;
	while(nbCo-1!=rangi){
		if(joueurs[rang]=="disconnected"){
			rang++;
		}
		else{
			nbCo++;
			rang++;
		}
	}
	return rang-1;
}

io.sockets.on('connection', function (socket) {
	
		//Envoie les rôles des joueurs quand la partie a commencé.
		socket.on('partieStart', function () {
			partieStarted = true;
			for(var i=0; i<joueurs.length; i++){
				if(joueurs[i]!='disconnected'){
					joueurs[i].emit('partieStart', {
						'idx' : i,
					});
					var tourJoueur = 'tireur';			
					if( (tour==0 && j_equipe[i]=='2') || (tour==1 && j_equipe[i]=='1') ){
						tourJoueur = 'cible';
					}
					joueurs[i].emit('tour',{	
						'tour' : tourJoueur,
					});					
				}
			}
			
			// Change les rôles des joueurs toutes les 10s
			setInterval(function(){
				if(tour==0){
					tour = 1;
				}
				else{
					tour = 0;
				}
				for(var i=0; i<clients.length; i++){
					clients[i].emit("changement-tour", {
						'tour' : tour,
					});
				}
				for(var i=0; i<joueurs.length; i++){
					if(joueurs[i]!='disconnected'){
						joueurs[i].emit("changement-tour");
					}
				}
				
			}, 10000);
		});
	
		
		
		// fait rebondir la balle ou la change d'écran quand il reçoit le message "ball-out" (en fonction des écrans connectés)
		socket.on("ball-out", function(data) {
			
			var idx = clients.indexOf(socket);
			var targetIdx = idx;
		    info[idx] = data.info;
			var yc;
			var left = data.bound == Balls.LEFT;
			
			if(left && idx > 0) {
				targetIdx--;
				data.bound = Balls.RIGHT;

				if(info[idx] == "Mozilla Firefox" && info[idx-1] == "Apple iPhone 5S"){
					yc = data.y*3.88;
				}else if(info[idx] == "Apple iPhone 5S" && info[idx-1] == "Mozilla Firefox"){
					yc = data.y/3.88;
				}else if(info[idx] == "Mozilla Firefox" && info[idx-1] == "Apple iPad"){
					yc = data.y*1.438;
				}else if(info[idx] == "Apple iPad" && info[idx-1] == "Mozilla Firefox"){
					yc = data.y/1.438;
				}else if(info[idx] == "Apple iPhone 5S" && info[idx-1] == "Apple iPad"){
					yc = data.y/2.6;
				}else if(info[idx] == "Apple iPad" && info[idx-1] == "Apple iPhone 5S"){
					yc = data.y*2.6;
				}
				else {
					yc = data.y;
				}
			} 
			else if(!left && idx < clients.length-1){
				targetIdx++;
				data.bound = Balls.LEFT;
				if(info[idx] == "Mozilla Firefox" && info[idx+1] == "Apple iPhone 5S"){
					yc = data.y*3.88;
				}else if(info[idx] == "Apple iPhone 5S" && info[idx+1] == "Mozilla Firefox"){
					yc = data.y/3.88;
				}else if(info[idx] == "Mozilla Firefox" && info[idx+1] == "Apple iPad"){
					yc = data.y*1.438;
				}else if(info[idx] == "Apple iPad" && info[idx+1] == "Mozilla Firefox"){
					yc = data.y/1.438;
				}else if(info[idx] == "Apple iPhone 5S" && info[idx+1] == "Apple iPad"){
					yc = data.y/2.6;
				}else if(info[idx] == "Apple iPad" && info[idx+1] == "Apple iPhone 5S"){
					yc = data.y*2.6;
				}else{
					yc = data.y;
				}
			}else {
				yc = data.y; // La balle rebondit normalement				
			}						
			
			// Envoie au Terrain concerné les paramètres de la balle qui entre/reste
			/*clients[targetIdx].emit("ball-in", {
				'y': yc,
				'dx': data.dx,
				'dy': data.dy,
				'bound': data.bound,
			});*/
		});
			
		function include(obj, arr) {
			return (arr.indexOf(obj) != -1);
		}
	
		// déconnecte l'écran quand il reçoit le message "disconnect"
		socket.on("disconnect", function() {
			if( include(socket, clients) ){
				console.log('Terrain déconnecté : ' + info[clients.indexOf(socket)] );
				clients.splice(clients.indexOf(socket), 1);
				if(clients.length==0){
					joueurs = [];
				}
			}
			else if( include(socket, joueurs) ){
				var idx = joueurs.indexOf(socket);	
				console.log('joueur déconnecté : joueur' + (idx+1)) ;
				joueurs[idx] = 'disconnected';
				clients[0].emit("joueur-out", {
					'idx' : idx,
				});	
				var equipe1=false;
				var equipe2=false;
				for(var i=0; i<joueurs.length; i++){
					if(joueurs[i] != 'disconnected'){
						if(j_equipe[i]=='1'){
							equipe1=true;
						}
						else{
							equipe2=true;
						}
					}
				}
				if(equipe1==false){
					for(var i=0; i<joueurs.length; i++){
						if(joueurs[i] != 'disconnected' && j_equipe[i]=='2'){
							joueurs[i].emit("gagné");	
						}
					}
				}
				if(equipe2==false){
					for(var i=0; i<joueurs.length; i++){
						if(joueurs[i] != 'disconnected' && j_equipe[i]=='1'){
							joueurs[i].emit("gagné");	
						}
					}
				}			
			}		
		});
		
		// Connecte le Terrain
		socket.on('jeu-in', function (data) {
			clients.push(socket);
			var idx = clients.indexOf(socket);	
			w[idx] = data.w;
			h[idx] = data.h;
			info[idx] = data.info;
			console.log('Nouveau terrain de dimensions :' + w[idx] + ' x ' + h[idx] + ' : ' + info[idx] );									
			
			var heightLeft;
			var heightRight;
			
			clients[idx].emit('initialisation-tour',{
				'tour' : tour,
			});
			
			// Envoie les zone de sortie de balle vers les écrans d'à côté s'il y en a, sinon prend comme zone sa propre taille
			/*if(idx!=0){
				clients
				heightLeft = Math.min(h[idx],h[idx-1]);			

				if(idx == 1){
					clients[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					clients[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :h[0],
					});
				}
				else{
					clients[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					clients[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :Math.min(h[idx-1],h[idx-2]),
					});
				}

			}
			else{
				heightLeft = h[idx];
				clients[idx].emit('jeu-out',{
					'heightLeft':heightLeft,
					'heightRight':heightLeft,	
				});
			}*/
			
		});
		
		// Modifie les variables du terrain quand il est modifié  (taille, hauteur...) et les transmet aux terrains d'à côté
		socket.on('jeu-modif', function (data) {
			var idx = clients.indexOf(socket);	
			w[idx] = data.w;
			h[idx] = data.h;
			info[idx] = data.info;
			console.log('Terrain maintenant de dimensions :' + w[idx] + ' x ' + h[idx] + ' : ' + info[idx] );	

			var heightLeft;
			var heightRight;
			
			// Envoie les zone de sortie de balle vers les écrans d'à côté s'il y en a, sinon prend comme zone sa propre taille
			if(idx!=0){
				clients
				heightLeft = Math.min(h[idx],h[idx-1]);			

				if(idx == 1){
					clients[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					clients[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :h[0],
					});
				}
				else{
					clients[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					clients[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :Math.min(h[idx-1],h[idx-2]),
					});
				}

			}
			else{
				heightLeft = h[idx];
				clients[idx].emit('jeu-out',{
					'heightLeft':heightLeft,
					'heightRight':heightLeft,	
				});
			}			
		});
		
		// Connecte le joueur
		socket.on('joueur-in', function (data) {
			var trouve=false;
			for(var i=0; i<joueurs.length; i++){
				if(trouve==false && joueurs[i]=='disconnected'){
					joueurs[i]=socket;
					trouve=true;
				}
			}
			if(trouve==false){
				joueurs.push(socket);
			}
			var idx = joueurs.indexOf(socket);	
			j_info[idx] = data.info;
			j_equipe[idx] = data.equipe;
			console.log('Nouveau joueur : ' + j_info[idx] );
			
			var heightLeft;
			var heightRight;
			
			// Envoie les zone de sortie de balle vers les écrans d'à côté s'il y en a, sinon prend comme zone sa propre taille
			/*if(idx!=0){
				heightLeft = Math.min(h[idx],h[idx-1]);			

				if(idx == 1){
					joueurs[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					joueurs[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :h[0],
					});
				}
				else{
					joueurs[idx].emit('jeu-out',{
						'heightLeft':heightLeft,
						'heightRight':h[idx],
					});
					joueurs[idx-1].emit('jeu-out',{
						'heightRight':heightLeft,
						'heightLeft' :Math.min(h[idx-1],h[idx-2]),
					});
				}
				
			}
			else{
				heightLeft = h[idx];
				joueurs[idx].emit('jeu-out',{
					'heightLeft':heightLeft,
					'heightRight':heightLeft,	
				});
			}*/
			
			// Informe le 1er terrain qu'un joueur s'est connecté
			clients[0].emit('joueur-in',{	
				'idx' : idx,
				'team' : data.equipe,
				'tour' : tour,
			});	
			
			// Si la partie a déjà commencé, envoie directement au joueur son rôle
			if( partieStarted==true ){
				joueurs[idx].emit('partieStart', {
					'idx' : idx,
				});
				var tourJoueur = 'tireur';			
				if( (tour==0 && j_equipe[idx]=='2') || (tour==1 && j_equipe[idx]=='1') ){
					tourJoueur = 'cible';
				}
				joueurs[idx].emit('tour',{	
					'tour' : tourJoueur,
				});					
			}
				
		});

		// Transmet l'information au terrain que la joueur bouge
		socket.on('position-change', function (data) {
			var idx = joueurs.indexOf(socket);	
			clients[0].emit('joueur-move',{	
				'positionX' : data.positionX,
				'positionY' : data.positionY,
				'idx' : idx,
			});
		});
		
		// Envoie au premier terrain qu'un joueur a envoyé une balle
		socket.on("ball-joueur-out", function(data) {
			var idx = joueurs.indexOf(socket);

			// Envoie au Terrain concerné les paramètres de la balle qui entre/reste
			clients[0].emit("ball-joueur-in", {
				'dx': data.dx,
				'dy': data.dy,
				'idx' : idx,
			});
		});
		
		// Lance la partie quand le terrain lui dit qu'elle a commencé
		socket.on("partie-in", function (data) {
			if (clients.length == 0) {
				socket.emit('partie-out', {
					'partieStart': false,
				});
			}
			else {
				socket.emit('partie-out', {
					'partieStart': true,	
				});
			}	
		});
		
		// Confirme (ou non) au terrain si joueur qu'il a été touché, et si oui envoie au joueur qu'il a été touché 
		socket.on("joueur-touché", function (data) {
			if( (tour==0 && j_equipe[data.idx]=='2') || (tour==1 && j_equipe[data.idx]=='1') ){
				console.log("Le joueur "+ (data.idx+1) +" est touché");				
				joueurs[data.idx].emit('touché', {
					'rangi': data.rangi,	
				});	
			}
			else{
				clients[0].emit('non-touché', {
					'rangi': data.rangi,
				});
			}			
		});
		
		/*socket.on("joueur-confirme-touche", function (data) {
			clients[0].emit('touché', {
				'rangi': data.rangi,
			});	
		});*/
		
		// Si le joueur lui indique qu'il n'était pas une cible quand il s'est fait touché, l'envoie au terrain
		socket.on("joueur-non-touche", function (data) {
			clients[0].emit('non-touché', {
				'rangi': data.rangi,
			});	
		});
		
	});
	


			
	
connect.createServer(
    connect.static(__dirname)
).listen(SERVER_PORT,SERVER_IP);
