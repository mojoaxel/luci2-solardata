L.ui.view.extend({
	title: L.tr('TracerTools'),
	//refresh: 30000, //TODO needed?

	/**
	 * TODO
	 */
	getSolarData: L.rpc.declare({
		object: 'solardata',
		method: 'solardata'
	}),
	
	/**
	 * TODO
	 */
	parseSolarData: function(solardata){
		//console.log("parseSolarData");
		var data = {
			modules: []
		};
		for (var key in solardata) {
			var obj = solardata[key];
			var values = obj.split(', ');
			data.modules.push({
				mac: (key || null),
				name:  (values[0].replace(/'/g, '') || null),
				datetime: (values[1].replace(/'/g, '') || null),
				bat_volt: (values[2] || null),
				in1_volt: (values[3] || null),
				in1_amp: (values[4] || null),
				in2_amp: (values[5] || null),
				bat_volt_min: (values[6] || null),
				bat_volt_max: (values[7] || null),
				temp1: (values[8] || null),
				chg_state: (values[9] || null),
				charging: (values[10] || null),
				load_switch: (values[11] || null)
			});
		}
		return data;
	},
	
	/**
	 * TODO
	 */
	updateUi: function(module) {
		console.log("updateUi");
		var self = this;
		
		if (!module) {
			return false;
		}
		
		module.bat_volt = parseFloat(module.bat_volt);
		module.bat_volt_min = parseFloat(module.bat_volt_min);
		module.bat_volt_max = parseFloat(module.bat_volt_max);
		module.in1_volt = parseFloat(module.in1_volt);
		module.in1_amp = parseFloat(module.in1_amp);
		module.in2_amp = parseFloat(module.in2_amp);
		module.temp1 = parseFloat(module.temp1);
		
		if (!self.bat_volt){
			self.bat_volt = new JustGage({
				id: "bat_volt", 
				value: module.bat_volt, 
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
		} else {
			self.bat_volt.refresh(
				module.bat_volt.toFixed(2)
			);
		}
		
		if (!self.in1_amp){
			self.in1_amp = new JustGage({
				id: "in1_amp", 
				value: module.in1_amp, 
				min: 0,
				max: 5,
				title: "Battery Current",
				label: "Ampare",
				gaugeWidthScale: 0.3,
				levelColors: ["#000000"],
				showMinMax: false,
				showInnerShadow: false
			});
		} else {
			self.in1_amp.refresh(
				module.in1_amp.toFixed(2)
			);
		}
		
		if (!self.gauge){
			self.gauge = new Gauge(document.getElementById('cf-gauge-1')).setOptions({
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
			self.gauge.minValue = 0; // set max gauge value
			self.gauge.maxValue = 200; // set max gauge value
			self.gauge.animationSpeed = 1; // set animation speed (32 is default value)
			self.gauge.set(100); // set actual value
		} else {
			var ampDiffPercent = null;
			if (module.in1_amp >= module.in2_amp) {
				ampDiffPercent = 100 - 100 * (module.in2_amp/module.in1_amp);
				//$('#cf-gauge-value').removeClass('red').addClass('green');
			} else {
				ampDiffPercent = -100 + 100 * (module.in1_amp/module.in2_amp);
				//$('#cf-gauge-value').removeClass('green').addClass('red');
			}
			self.gauge.animationSpeed = 5;
			self.gauge.set(100-ampDiffPercent); // set actual value
			$('#cf-gauge-value').text(ampDiffPercent.toFixed(2) + "%");
		}
		
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
	},
	
	/**
	 * TODO
	 */
	updateSolarData: function() {
		console.log("updateSolarData");
		var self = this;
		self.getSolarData().then(function(solardata){ 
			
			// only continue if solardata changed
			if (!self.lastSolardata || JSON.stringify(self.lastSolardata) !== JSON.stringify(solardata)) {
				self.lastSolardata = solardata;
			} else {
				return;
			}
			
			var data = self.parseSolarData(solardata);
			var modules = data.modules;

			var $moduleSelect = $('#solarselect');
			$moduleSelect.empty();
			$.each(data.modules, function(index, module) {
				var o = $('<option>' + module.name + '</option>');
				if (index === self.moduleIndex) o.attr('selected', 'selected');
				$moduleSelect.append(o);
			});
			$moduleSelect.on('change', function(e) {
				self.moduleIndex = e.currentTarget.selectedIndex;
				self.updateUi(data.modules[self.moduleIndex]);
			});
			
			self.updateUi(data.modules[self.moduleIndex]);
		});
	},
	
	/**
	 * TODO
	 */
	execute: function() {
		//console.log("execute");
		var self = this;
		
		self.bat_volt = null;
		self.in1_amp = null;
		self.gauge = null;
		self.moduleIndex = 0;
		
		self.repeat(self.updateSolarData, 10000);
		
		return true;
	}
});
