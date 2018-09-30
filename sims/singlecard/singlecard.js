var flashcard = $("#flashcard");
var FLIPPED = false;
flashcard.onclick = function(){

	// Flip!
	var flip = flashcard.getAttribute("flip");
	if(flip=="yes"){
		flashcard.setAttribute("flip","no");
	}else{
		flashcard.setAttribute("flip","yes");

		// HACK: PLAY AUDIO
		var a = $("#HACK_audio");
		if(a){
			a.play();
			if(!a.onclick){
				a.onclick = function(e){
					e.stopPropagation();
				};
			}
		}

	}

	// Also, send message (when flipped for first time)
	if(!FLIPPED && window.top.broadcastMessage){
		FLIPPED = true;
		setTimeout(function(){
			window.top.broadcastMessage("flip_"+cardname);
		},1000);
	}

};

window.cardname = _getQueryVariable("card");
var frontHTML = _getLabel("flashcard_"+cardname+"_front");
var backHTML = _getLabel("flashcard_"+cardname+"_back");
$("#front").innerHTML = frontHTML;
$("#back").innerHTML = backHTML;

_modifyFlashCard($("#front"));
_modifyFlashCard($("#back"));

// Refresh in real time...
if(_getQueryVariable("refresh")=="yes"){

	var dom = back.querySelector(".fcard_center");

	dom.style.top = "auto";
	dom.style.bottom = "auto";

	var _reAlign = function(){
		var bounds = dom.getBoundingClientRect();
		dom.style.top = (((240-bounds.height)/2)-10) +"px";
	};
	_reAlign();

	window.top.subscribe("answer_edit_"+cardname, function(new_answer){
		dom.innerText = new_answer;
		_reAlign();
	});

}