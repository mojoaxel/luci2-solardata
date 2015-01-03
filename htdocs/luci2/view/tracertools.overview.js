L.ui.view.extend({
	title: L.tr('TracerTools'),
	refresh: 5000,

	getSolarData: L.rpc.declare({
		object: 'solardata',
		method: 'solardata'
	}),
	
	parseSolarData: function(solardata){
		var data = {
			modules: []
		};
		for (var key in solardata) {
			var obj = solardata[key];
			var values = obj.split(', ');
			
			var name = values[0].replace(/'/g, '') || null;
			var datetime = values[1].replace(/'/g, '') || null;
			var bat_volt = values[2] || null;
			var in1_volt = values[3] || null;
			var in1_amp = values[4] || null;
			var in2_amp = values[5] || null;
			var bat_volt_min = values[6] || null;
			var bat_volt_max = values[7] || null;
			var temp1 = values[8] || null;
			var chg_state = values[9] || null;
			var charging = values[10] || null;
			var load_switch = values[11] || null;
			
			data.modules.push({
				mac: (key || null),
				name:  name,
				datetime: datetime,
				bat_volt: bat_volt,
				bat_volt_min: bat_volt_min,
				bat_volt_max: bat_volt_max,
				in1_volt: in1_volt,
				in1_amp: in1_amp,
				in2_amp: in2_amp,
				temp1: temp1,
				chg_state: chg_state,
				charging: charging,
				load_switch: load_switch
			});
		}
		return data;
	},
	
	execute: function() {
		var self = this;
		
		var dummy = {
				"modules": [{
					mac: "??????????",
					name: "",
					datetime: null,
					bat_volt: 0,
					bat_volt_min: 10.8,
					bat_volt_max: 14.2,
					in1_volt: 0,
					in1_amp: 0,
					in2_amp: 0,
					temp1: null,
					chg_state: 1,
					charging: 1,
					load_switch: 0
				}]
			};
		
		var module = dummy.modules[0];
		
		var bat_volt = new JustGage({
			id: "bat_volt", 
			value: 14, 
			min: module.bat_volt_min,
			max: module.bat_volt_max,
			title: "Battery Voltage",
			label: "Volt",
			gaugeWidthScale: 0.9,
			startAnimationTime: 2,
			startAnimationType: "bounce",
			refreshAnimationType: ">",
			levelColorsGradient: false,
			levelColors: [ "#FF0000", "#33CC33", "#00FF00" ]
		});
		
		
		var in1_amp = new JustGage({
			id: "in1_amp", 
			value: '?', 
			min: 0,
			max: 3,
			title: "Battery Current",
			label: "Ampare",
			gaugeWidthScale: 0.3,
			levelColors: ["#000000"],
			showMinMax: false,
			showInnerShadow: false
		});
		
		var target = document.getElementById('cf-gauge-1'); // your canvas element
		var gauge = new Gauge(target).setOptions({
			lines: 1, // The number of lines to draw
			angle: 0.15, // The length of each line
			lineWidth: 0.14, // The line thickness
			pointer: {
				length: 0.9, // The radius of the inner circle
				strokeWidth: 0.025, // The rotation offset
				color: '#000000' // Fill color
			},
			limitMax: 'true',   // If true, the pointer will not go past the end of the gauge
			colorStart: '#FF0000',   // Colors
			colorStop: '#FF0000',    // just experiment with them
			strokeColor: '#00FF00',   // to see which ones work best for you
			generateGradient: true
		}); // create sexy gauge!
		gauge.minValue = 0; // set max gauge value
		gauge.maxValue = 200; // set max gauge value
		gauge.animationSpeed = 1; // set animation speed (32 is default value)
		gauge.set(100); // set actual value
		
		function updateUi(module) {
			module.bat_volt = parseFloat(module.bat_volt);
			module.bat_volt_min = parseFloat(module.bat_volt_min);
			module.bat_volt_max = parseFloat(module.bat_volt_max);
			module.in1_volt = parseFloat(module.in1_volt);
			module.in1_amp = parseFloat(module.in1_amp);
			module.in2_amp = parseFloat(module.in2_amp);
			module.temp1 = parseFloat(module.temp1);
			
			var $valuelist = $('.valuelist');
			$valuelist.find('.in1_volt').text(module.in1_volt + " V");
			$valuelist.find('.in_power').text((module.in1_volt * (module.in1_amp-module.in2_amp)).toFixed(2) + " W");
			$valuelist.find('.temp1').html(module.temp1 + " &deg;C");
			$valuelist.find('.alarms').text("no");
			var date = moment(module.datetime.replace('CET ', '').substr(4), "MMMM D h:m:s GGGG");
			$valuelist.find('.date').text(date.format("DD.MM.YY"));
			$valuelist.find('.time').text(date.format("HH:mm:ss"));
			
			$('.value.in1_amp').text('+' + module.in1_amp.toFixed(2));
			$('.value.in2_amp').text('-' + module.in2_amp.toFixed(2));
			
			bat_volt.refresh(
					module.bat_volt.toFixed(2)
			);
			in1_amp.refresh(
					module.in1_amp.toFixed(2)
			);
			
			var ampDiffPercent = null;
			if (module.in1_amp >= module.in2_amp) {
				ampDiffPercent = 100 - 100 * (module.in2_amp/module.in1_amp);
				//$('#cf-gauge-value').removeClass('red').addClass('green');
			} else {
				ampDiffPercent =  - 100 + 100 * (module.in1_amp/module.in2_amp);
				//$('#cf-gauge-value').removeClass('green').addClass('red');
			}
			gauge.animationSpeed = 5;
			gauge.set(100-ampDiffPercent); // set actual value
			$('#cf-gauge-value').text(ampDiffPercent.toFixed(2) + "%");
		}
		
		function update() {
			self.getSolarData().then(function(solardata){ 
				var modules = self.parseSolarData(solardata).modules;

				var $moduleSelect = $('#solarselect');
				$moduleSelect.empty();
				$.each(modules, function(index, module) {
					$moduleSelect.append($('<option>' + module.name + '</option>'));
				});
				$moduleSelect.on('change', function(e) {
					var index = e.currentTarget.selectedIndex;
					console.log("INDEX: ", index)
					updateUi(modules[index]);
				});
				
				updateUi(modules[0]);
			});
		}
		
		update();
		
		return true;
	}
});
