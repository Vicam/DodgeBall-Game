$(document).on('pageinit', function(){
	var isPartieCreer;
	socket = io.connect('http://'+SERVER_IP+":"+WEBSOCKET_PORT);
	
	// Informe l'utilisateur si une partie a déjà été crée ou non quand il veut en créer une autre
	$('#buttonCreerPartie').click(function(){
		socket.emit('partie-in', {
			'info' : WURFL.complete_device_name, 
			});
		socket.on('partie-out', function(data) {
			isPartieCreer = data.partieStart;		
		});
		setTimeout(function(){
			if (isPartieCreer) {
				alert(" Il y a déjà une partie en cours. ");
			}
			else {
				document.location.href = 'jeu.html';
			}
		}, 500);
	});
	
	// Informe l'utilisateur si une partie a déjà été crée ou non quand il veut en rejoindre une
	$('#buttonRejoindrePartie').click(function(){
		socket.emit('partie-in', {});
		socket.on('partie-out', function(data) {
			isPartieCreer = data.partieStart;
		});
		setTimeout(function(){
			if (isPartieCreer) {
				document.location.href = 'selectionEquipe.html';
			}
			else {
				alert(" Aucune partie n'a été créée. Veuillez créer une partie. ");
			}
		}, 500);
	});
	
	$('#buttonEquipe1').click(function(){
		document.location.href = 'manetteJoueur.html?equipe=1';
	});
	$('#buttonEquipe2').click(function(){
		document.location.href = 'manetteJoueur.html?equipe=2';
	});
	
});

/*	$( document).ready(function() {
		Ecran.init();	
	}); 
		
	
var Ecran = {
	
	getRole : function(){
		if(document.getElementById('radio1').checked ){
			return 'terrain';
		}
		else{
			return 'joueur';
		}
	},
	
	changePage : function(){
		if(document.getElementById('radio1').checked ){
			document.location.href = 'jeu.html';
		}
		else if(document.getElementById('radio2').checked ){
			document.location.href = 'manetteCible.html';
		}
		else{
			document.location.href = 'manetteTireur.html';
		}
	},
	
	init : function() {
		console.log("Initialisation : connection");
		console.log(WURFL);
		
		$('#button').click(function(){
			Ecran.changePage();
		});
	}
	
}*/
		
