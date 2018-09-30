window.MODE = -1;
window.onload = function(){

	// Get Mode
	window.MODE = parseInt( _getQueryVariable("mode") );

	// Init labels
	$("#y_axis").innerHTML = _getLabel("ebbinghaus_y_axis");
	$("#x_axis").innerHTML = _getLabel("ebbinghaus_x_axis");

	// Initialize all the things!
	switch(MODE){
		// Just decay
		case 0:
			sim_params.push(_sliders.d);
			break;
		// ONE retrieval
		case 1:
			recall_params.push(_sliders.r1);
			break;
		// ONE retrieval, with optimal learning
		case 2:
			PARAMS.optimal = 0.75;
			recall_params.push(_sliders.r1);
			break;
		// MULTI retrievals, with optimal learning
		case 3:
			PARAMS.optimal = 0.75;
			recall_params.push(_sliders.r1);
			recall_params.push(_sliders.r2);
			recall_params.push(_sliders.r3);
			recall_params.push(_sliders.r4);
			break;
		// FULL SANDBOX
		case 4:
			
			sim_params.push(_sliders.d);
			sim_params.push(_sliders.o);

			recall_params.push(_sliders.r1);
			recall_params.push(_sliders.r2);
			recall_params.push(_sliders.r3);
			recall_params.push(_sliders.r4);

			break;
	}
	sim_params.concat(recall_params).forEach(_createParamSlider);

	// Add UI
	switch(MODE){
		// Just decay
		case 0:
			_appendSpan("ebbinghaus_decay");
			_appendSlider("init_decay");
			break;
		// ONE retrieval
		case 1:
			_appendSpan("ebbinghaus_recalls");
			_appendSlider("recall_1");
			break;
		// ONE retrieval, with optimal learning
		case 2:
			_appendSpan("ebbinghaus_recalls");
			_appendSlider("recall_1");
			break;
		// MULTI retrievals, with optimal learning
		case 3:
			_appendSpan("ebbinghaus_recalls");
			_appendSlider("recall_1");
			_appendSlider("recall_2");
			_appendSlider("recall_3");
			_appendSlider("recall_4");
			break;
		// FULL SANDBOX
		case 4:
			
			_appendSpan("ebbinghaus_decay");
			_appendSlider("init_decay");

			_appendSpan("ebbinghaus_forgetting");
			_appendSlider("optimal");

			_appendBr();
			_appendBr();

			_appendSpan("ebbinghaus_recalls");
			_appendButton("ebbinghaus_auto",_AUTO_OPTIMIZE);
			_appendSlider("recall_1");
			_appendSlider("recall_2");
			_appendSlider("recall_3");
			_appendSlider("recall_4");

			break;
	}

	// Update
	window.PARAMS_CHANGED = true;
	update();

};

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

// The most fudge-y function in existence
var _AUTO_OPTIMIZE = function(){

	// When t hits the sweet spot (k)...
	// k = A*e^(-Bt)
	// Therefore:
	// t = (ln(A) - ln(k))/B
	// Dunno what A & B are. Fudge it.

	var A = 1; // coz, at 0, it's 1. Duh.
	var k = PARAMS.optimal;
	var B = 102 * PARAMS.init_decay * MAGIC_CONSTANT; // FUDGE IT.
	var timing = (Math.log(A) - Math.log(k))/B;

	// Set first one!
	_sliderUI.recall_1.value = timing;
	_sliderUI.recall_1.oninput();

	// Multiply by fudged values for the rest.
	timing *= 2.92;
	_sliderUI.recall_2.value = timing;
	_sliderUI.recall_2.oninput();
	timing *= 2.23;
	_sliderUI.recall_3.value = timing;
	_sliderUI.recall_3.oninput();
	timing *= 2.01;
	_sliderUI.recall_4.value = timing;
	_sliderUI.recall_4.oninput();

};

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

var canvas = document.getElementById("graph");
var ctx = canvas.getContext('2d');

// Params & their sliders
var PARAMS = {};
var sim_params = [];
var recall_params = [];
var _sliders = {
	d: {name:"init_decay", min:0, max:1, step:0.01, value:0.5},
	o: {name:"optimal", min:0, max:1, step:0.01, value:0.75},
	r1: {name:"recall_1", min:0, max:10, step:0.01, value:2.0, fullw:true},
	r2: {name:"recall_2", min:0, max:10, step:0.01, value:4.0, fullw:true},
	r3: {name:"recall_3", min:0, max:10, step:0.01, value:6.0, fullw:true},
	r4: {name:"recall_4", min:0, max:10, step:0.01, value:8.0, fullw:true},
	//r5: {name:"recall_5", min:0, max:10, step:0.01, value:2.5, fullw:true}
};
var _sliderUI = {};
var _appendBr = function(){
	$("#ui").appendChild(document.createElement("br"));
};
var _appendSpan = function(name){
	var label = _getLabel(name);
	var span = document.createElement("span");
	span.innerHTML = label;
	$("#ui").appendChild(span);
};
var _appendSlider = function(name){
	$("#ui").appendChild(_sliderUI[name]);
}
var _appendButton = function(name, onclick){
	var label = _getLabel(name);
	var button = document.createElement("button");
	button.innerHTML = label;
	button.onclick = onclick;
	$("#ui").appendChild(button);
};

window.PARAMS_CHANGED = false;
var _createParamSlider = function(config){
	
	// Make DOM
	var slider = document.createElement("input");
	slider.type = "range";
	slider.min = config.min;
	slider.max = config.max;
	slider.step = config.step;
	slider.value = config.value;
	if(config.fullw) slider.setAttribute("fullw","yes");

	// Gimme DOM
	_sliderUI[config.name] = slider;

	// Sync it
	var _onSliderUpdate = function(){
		PARAMS[config.name] = parseFloat(slider.value);
		PARAMS_CHANGED = true;
	};
	slider.oninput = _onSliderUpdate;
	_onSliderUpdate();

};

// Update
var MAGIC_CONSTANT = 0.013815; // Through pure brute force, don't care.
var ERROR = 0.00001;
var OPTIMAL_RANGE = 0.10; //0.05;
function update(){

	// Don't re-draw unnecessarily!
	if(window.PARAMS_CHANGED){

		window.PARAMS_CHANGED = false;

		// Clear & Retina
		ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		ctx.save();
		ctx.scale(2,2);

		// Memory strength over 1000 iterations...
		var memory = 1; // full strength at first!
		var decay = PARAMS.init_decay!==undefined ? PARAMS.init_decay : 0.5; // init decay...
		var optimal = PARAMS.optimal!==undefined ? PARAMS.optimal : 999;
		var curves = [
			{ start:0, memory:1, decay:decay, line:[], cut:-1 } // original line
		];

		//debugger;

		var ALREADY_USED_THESE_CUTS = {};

		// For each timestep, and all curves...
		for(var t=0; t<=10; t+=0.01){
			for(var c=0; c<curves.length; c++){

				var curve = curves[c];

				// Record!
				curve.line.push({
					t: t,
					m: curve.memory
				});

				// Decay a bit...
				curve.memory -= curve.memory * curve.decay * MAGIC_CONSTANT; 

				// If not already cut...
				if(curve.cut<0){

					// If this is in a recall session, create ONE NEW CURVE
					// Find THE FIRST AND ONLY ONE cut.
					for(var cutIndex=0; cutIndex<recall_params.length; cutIndex++){

						var config = recall_params[cutIndex];

						if(ALREADY_USED_THESE_CUTS[config.name]) continue; // DON'T RE-USE CUT

						var recall_t = PARAMS[config.name];
						if(Math.abs(t-recall_t)<ERROR){ // floating point
							
							// If memory is near optimal range, HALVE decay.
							if(Math.abs(curve.memory-optimal)<OPTIMAL_RANGE){
								//decay *= 0.5;
								// Continuous?
								var distanceFromOptimal = Math.abs(curve.memory-optimal)/OPTIMAL_RANGE;
								var decayMultiplier = (0.5+distanceFromOptimal*0.5); // (0,1) => (0.5,1.0)
								decay *= decayMultiplier;
							}else{
								if(MODE===1){
									decay *= 0.9; // helps a little bit ANYWAY?
								}
							}

							// Cut THIS curve.
							curve.cut = t;

							// Create new curve!
							curves.push({
								start: t,
								memory: 1, // boost memory to top!
								decay: decay,
								line: [],
								cut: -1
							});

							// WE USED THIS CUT
							ALREADY_USED_THESE_CUTS[config.name] = true;

							// And, use NO MORE CUTS
							break;

						}

					};

				}


			}

		}

		// DRAW.

		// Days
		/*ctx.strokeStyle = "#ddd";
		ctx.lineWidth = 1;
		ctx.beginPath();
		for(var t=0; t<10; t++){
			var from = _project(t,0);
			var to = _project(t,1);
			ctx.moveTo(from.x,from.y);
			ctx.lineTo(to.x,to.y);
		}
		ctx.stroke();*/

		// Ideal Forgetting
		//ctx.fillStyle = "#FFD700";
		var tl = _project(0,optimal+OPTIMAL_RANGE);
		var br = _project(10,optimal-OPTIMAL_RANGE);
		var gradient = ctx.createLinearGradient(0, tl.y, 0, br.y);
		gradient.addColorStop(0.0, "hsl(51, 100%, 50%, 0)");
		gradient.addColorStop(0.5, "hsl(51, 100%, 50%, 0.5)");
		gradient.addColorStop(1.0, "hsl(51, 100%, 50%, 0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(tl.x, tl.y, br.x-tl.x, br.y-tl.y);

		// DRAW THE POTENTIAL CURVES
		ctx.lineJoin = ctx.lineCap = "round";
		ctx.lineWidth = 1;
		ctx.strokeStyle = "rgba(0,0,0,0.2)";
		for(var c=0; c<curves.length; c++){
			var curve = curves[c];
			if(curve.cut>=0){ // only draw if line HAS been cut
				var imCut = false;
				for(var i=0; i<curve.line.length; i++){
					var point = curve.line[i];
					p = _project(point.t, point.m);
					if(point.t>=curve.cut && !imCut){ // CUT. Start drawing!
						ctx.beginPath();
						ctx.moveTo(p.x,p.y);
						imCut = true;
					}else{
						ctx.lineTo(p.x,p.y);
					}
				}
				ctx.stroke();
			}
		}

		// DRAW THE MAIN THICK CURVES
		ctx.lineWidth = 5;
		// For each curve, draw until cut.
		for(var c=0; c<curves.length; c++){

			var curve = curves[c];

			// Redness for decay
			var d = Math.sqrt(Math.sqrt(curve.decay));
			var saturation =  Math.round(d*100); // (0,1) => (0,100)
			var lightness = Math.round(d*70); // (0,1) => (0,60)
			ctx.strokeStyle = "hsl(0,"+saturation+"%,"+lightness+"%)";

			var imCut = false;
			for(var i=0; i<curve.line.length; i++){
				var point = curve.line[i];
				if(curve.cut<0 || point.t<=curve.cut){ // CUT
					p = _project(point.t, point.m);
					if(i==0){
						ctx.beginPath();
						ctx.moveTo(p.x,p.y);
					}else{
						ctx.lineTo(p.x,p.y);
					}
				}else if(!imCut){
					p = _project(point.t, 1);
					ctx.lineTo(p.x,p.y);
					imCut = true;
				}
			}
			ctx.stroke();

		}

		// And, again...
		ctx.restore();

	}

	requestAnimationFrame(update);

}

var _project = function(x,y){
	return {
		x: (x/10.05) * (canvas.width/2), // retina (with lil' buffer)
		y: (1-(y*0.98)) * (canvas.height/2) // retina (with lil' buffer)
	};
};