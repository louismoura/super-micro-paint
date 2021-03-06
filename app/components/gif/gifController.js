angular.module('super-micro-paint', ['upload'])
    .config( [
        '$compileProvider',
        function( $compileProvider )
        {   
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob|chrome-extension):/);
        }
    ])
    .controller('gifController', ['$scope', 'imgur', function ($scope, imgur) {

        var getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };
        $scope.downloadAttrSupported = ("download" in document.createElement("a"));
        $scope.renderMode = 'LCD';
        $scope.colors = 'Super Micro Paint';
        $scope.colors2 = '';
        $scope.delay = 400;
        $scope.scale = 16;
        $scope.invert = false;
        $scope.isReady = false;
        $scope.isUploading = false;
        $scope.blob = {};
        $scope.currentPage = location.href;
        $scope.editPage = location.href.split('/').slice(0, -2).join('/') + "/#" + getParameterByName('smp');
        $scope.gifTitle = "My Masterpiece";
        $scope.encodedGifTitle = "My%20Masterpiece";
        $scope.dataUri = "";
        $scope.gifId = "";
        $scope.gifUrl = "";
        $scope.gifShareUrl = "";
        $scope.gifDirectUrl = "";
        var h = 16;
        var w = 32;
        $scope.upload = function() {
            $scope.gifId = "";
            $scope.isUploading = true;
            $scope.isReady = false;
            imgur.upload($scope.blob, $scope.gifTitle).then(function (response) {
                $scope.$apply(function () {
                    $scope.gifId = response.id;
                    $scope.gifUrl = 'http://imgur.com/' + response.id;
                    $scope.gifShareUrl = response.gifv;
                    $scope.gifDirectUrl = response.link;
                    $scope.isReady = true;
                    $scope.isUploading = false;
                });
            });
        };
        $scope.modeChanged = function() {
            if ($scope.scale < $scope.renderModes[$scope.renderMode].minSize) {
                $scope.scale = $scope.renderModes[$scope.renderMode].minSize;
            }
            if ($scope.modeUsesDualColors($scope.renderModes[$scope.renderMode])) {
                $scope.colors = Object.keys($scope.renderModes[$scope.renderMode].colors.set1)[0];
                $scope.colors2 = Object.keys($scope.renderModes[$scope.renderMode].colors.set2)[0];
            } else {
                $scope.colors = Object.keys($scope.renderModes[$scope.renderMode].colors)[0];
                $scope.colors2 = '';
            }
            drawGif();
        };

        $scope.modeUsesDualColors = function(mode) {
            return (mode.colors.hasOwnProperty("dual") && mode.colors.dual === true);
        };

        $scope.scales = [];
        for (i = 1; i <= 16; i++) {
            var s = {
                label: i + "x (" + w * i + " x " + h * i + ")",
                scale: i,
            };
            $scope.scales.push(s);
        }
        $scope.validScale = function(s) {
            return s.scale >= $scope.renderModes[$scope.renderMode].minSize;
        };
        $scope.scaleChanged = function() {
            drawGif();
        };
        $scope.speeds = [
            {label:'Slow', delay:800, minSize: 8},  
            {label:'Normal', delay:400, minSize: 1},  
            {label:'Fast', delay:100, minSize: 4}, 
        ];
        $scope.speedChanged = function() {
            drawGif();
        };
        $scope.colorsChanged = function() {
            drawGif();
        };
        $scope.invertChanged = function() {
            drawing.forEach( function (frame) {frame.invert();} );
            drawGif();
        };
        $scope.titleChanged = function() {
            $scope.encodedGifTitle = encodeURIComponent($scope.gifTitle);
        };
        var numFrames = 4;
        var drawing = [];
        var inverse = [];
        var base64Drawing = getParameterByName('smp');

        $scope.renderModes = {};

        $scope.renderModes.LCD = {};
        $scope.renderModes.LCD.minSize = 8;
        $scope.renderModes.LCD.colors = {
            'Super Micro Paint': {bg: '#DCF0E6', on: 'rgba(40, 40, 40, 0.85)', off: 'rgba(40, 40, 40, 0.05)'},
            'Green Boy': {bg: '#D8D8C0', on: '#113711', off: 'rgba(40, 40, 40, 0.05)'},
            'Backlit Indigo': {bg: '#77ddf2', on: 'rgba(40, 40, 40, 0.90)', off: 'rgba(40, 40, 40, 0.01)'},
            'Backlit Green': {bg: '#11ff11', on: 'rgba(40, 40, 40, 0.90)', off: 'rgba(40, 40, 40, 0.03)'},
            'Classic Grey': {bg: '#dddddd', on: 'rgba(40, 40, 40, 0.80)', off: 'rgba(40, 40, 40, 0.02)'},
        };
        $scope.renderModes.LCD.drawCommands = function(colors) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.on;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.shadowBlur =  2;
                    ctx.shadowColor = '#888';
                    ctx.fillRect(x + 1, y + 1, pixelW - 1 * 2, pixelH - 1 * 2);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.off;
                    ctx.fillRect(x + 1, y + 1, pixelW - 1 * 2, pixelH - 1 * 2);              
                    ctx.restore();
                }
            };
        };

        $scope.renderModes['Just Pixels (C64 Palette)'] = {};
        $scope.renderModes['Just Pixels (C64 Palette)'].minSize = 1;
        $scope.renderModes['Just Pixels (C64 Palette)'].colors = {
            dual: true,
            set1: {
                "Black":       {fg: '#000000'},
                "White":       {fg: '#ffffff'},
                "Red":         {fg: '#883932'},
                "Cyan":        {fg: '#67B6BD'},
                "Purple":      {fg: '#8B3F96'},
                "Green":       {fg: '#55A049'},
                "Blue":        {fg: '#40318D'},
                "Yellow":      {fg: '#BFCE72'},
                "Orange":      {fg: '#8B5429'},
                "Brown":       {fg: '#574200'},
                "Light Red":   {fg: '#B86962'},
                "Dark Grey":   {fg: '#505050'},
                "Grey":        {fg: '#787878'},
                "Light Green": {fg: '#94E089'},
                "Light Blue":  {fg: '#7869C4'},
                "Light Grey":  {fg: '#9F9F9F'},
            },
            set2: {
                "White":       {bg: '#ffffff'},
                "Black":       {bg: '#000000'},
                "Red":         {bg: '#883932'},
                "Cyan":        {bg: '#67B6BD'},
                "Purple":      {bg: '#8B3F96'},
                "Green":       {bg: '#55A049'},
                "Blue":        {bg: '#40318D'},
                "Yellow":      {bg: '#BFCE72'},
                "Orange":      {bg: '#8B5429'},
                "Brown":       {bg: '#574200'},
                "Light Red":   {bg: '#B86962'},
                "Dark Grey":   {bg: '#505050'},
                "Grey":        {bg: '#787878'},
                "Light Green": {bg: '#94E089'},
                "Light Blue":  {bg: '#7869C4'},
                "Light Grey":  {bg: '#9F9F9F'},
            }
        };
        $scope.renderModes['Just Pixels (C64 Palette)'].drawCommands = function(colors, colors2) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors2.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.fg;
                    ctx.fillRect(x, y, pixelW, pixelH);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                }
            };
        };

        $scope.renderModes['Just Pixels (CGA Palette)'] = {};
        $scope.renderModes['Just Pixels (CGA Palette)'].minSize = 1;
        $scope.renderModes['Just Pixels (CGA Palette)'].colors = {
            dual: true,
            set1: {
                "Black":        {fg: '#000000'},
                "Low Blue":     {fg: '#0000aa'},
                "Low Green":    {fg: '#00aa00'},
                "Low Cyan":     {fg: '#00aaaa'},
                "Low Red":      {fg: '#aa0000'},
                "Low Magenta":  {fg: '#aa00aa'},
                "Brown":        {fg: '#aa5500'},
                "Light Gray":   {fg: '#aaaaaa'},
                "Dark Gray":    {fg: '#555555'},
                "High Blue":    {fg: '#5555ff'},
                "High Green":   {fg: '#55ff55'},
                "High Cyan":    {fg: '#55ffff'},
                "High Red":     {fg: '#ff5555'},
                "High Magenta": {fg: '#ff55ff'},
                "Yellow":       {fg: '#ffff55'},
                "White":        {fg: '#ffffff'},
            },
            set2: {
                "White":        {bg: '#ffffff'},
                "Black":        {bg: '#000000'},
                "Low Blue":     {bg: '#0000aa'},
                "Low Green":    {bg: '#00aa00'},
                "Low Cyan":     {bg: '#00aaaa'},
                "Low Red":      {bg: '#aa0000'},
                "Low Magenta":  {bg: '#aa00aa'},
                "Brown":        {bg: '#aa5500'},
                "Light Gray":   {bg: '#aaaaaa'},
                "Dark Gray":    {bg: '#555555'},
                "High Blue":    {bg: '#5555ff'},
                "High Green":   {bg: '#55ff55'},
                "High Cyan":    {bg: '#55ffff'},
                "High Red":     {bg: '#ff5555'},
                "High Magenta": {bg: '#ff55ff'},
                "Yellow":       {bg: '#ffff55'},
            }
        };
        $scope.renderModes['Just Pixels (CGA Palette)'].drawCommands = function(colors, colors2) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors2.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.fg;
                    ctx.fillRect(x, y, pixelW, pixelH);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                }
            };
        };

        $scope.renderModes['Just Pixels (PICO-8 Palette)'] = {};
        $scope.renderModes['Just Pixels (PICO-8 Palette)'].minSize = 1;
        $scope.renderModes['Just Pixels (PICO-8 Palette)'].colors = {
            dual: true,
            set1: {
                "Black":        {fg: '#000000'}, 
                "Dark Blue":    {fg: '#1D2B53'},
                "Dark Purple":  {fg: '#7E2553'},
                "Dark Green":   {fg: '#008751'},
                "Brown":        {fg: '#AB5236'},
                "Dark Gray":    {fg: '#5F574F'},
                "Light Gray":   {fg: '#C2C3C7'},
                "White":        {fg: '#FFF1E8'},
                "Red":          {fg: '#FF004D'},
                "Orange":       {fg: '#FFA300'},
                "Yellow":       {fg: '#FFFF27'},
                "Green":        {fg: '#00E756'},
                "Blue":         {fg: '#29ADFF'},
                "Indigo":       {fg: '#83769C'},
                "Pink":         {fg: '#FF77A8'},
                "Peach":        {fg: '#FFCCAA'},
            },
            set2: {
                "White":        {bg: '#FFF1E8'},
                "Black":        {bg: '#000000'}, 
                "Dark Blue":    {bg: '#1D2B53'},
                "Dark Purple":  {bg: '#7E2553'},
                "Dark Green":   {bg: '#008751'},
                "Brown":        {bg: '#AB5236'},
                "Dark Gray":    {bg: '#5F574F'},
                "Light Gray":   {bg: '#C2C3C7'},
                "Red":          {bg: '#FF004D'},
                "Orange":       {bg: '#FFA300'},
                "Yellow":       {bg: '#FFFF27'},
                "Green":        {bg: '#00E756'},
                "Blue":         {bg: '#29ADFF'},
                "Indigo":       {bg: '#83769C'},
                "Pink":         {bg: '#FF77A8'},
                "Peach":        {bg: '#FFCCAA'},
            }
        };
        $scope.renderModes['Just Pixels (PICO-8 Palette)'].drawCommands = function(colors, colors2) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors2.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.fg;
                    ctx.fillRect(x, y, pixelW, pixelH);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                }
            };
        };

        $scope.renderModes.VFD = {};
        $scope.renderModes.VFD.minSize = 4;
        $scope.renderModes.VFD.colors = {
            'Flourescent Blue': {bg: 'rgb(0, 0, 0)', on: 'rgb(128, 240, 240)', off: 'rgb(10, 20, 20)'},
            'Flourescent Green': {bg: 'rgb(0, 0, 0)', on: 'rgb(128, 255, 128)', off: 'rgb(10, 20, 10)'},
            'Flourescent Red':   {bg: 'rgb(0, 0, 0)', on: 'rgb(255, 96, 64)', off: 'rgb(20, 10, 10)'},
            'Flourescent Pink': {bg: 'rgb(0, 0, 0)', on: 'rgb(240, 180, 160)', off: 'rgb(20, 15, 15)'},
            'Flourescent Amber':  {bg: 'rgb(0, 0, 0)', on: 'rgb(255, 191, 60)', off: 'rgb(20, 15, 10)'},
            'Flourescent Yellow':  {bg: 'rgb(0, 0, 0)', on: 'rgb(255, 235, 00)', off: 'rgb(20, 20, 00)'},
        };
        $scope.renderModes.VFD.drawCommands = function(colors) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.on;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors.on;
                    ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.off;
                    ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
                    ctx.restore();        
                }
            };
        };

        $scope.renderModes.LED = {};
        $scope.renderModes.LED.minSize = 12;
        $scope.renderModes.LED.colors = {
            'Red': {on1: '#ff6b6b', on2: '#660000'},
            'Blue': {on1: '#99eeff', on2: '#2255ff'},
            'Purple': {on1: '#eeaaff', on2: '#6600ee'},
            'Pink': {on1: '#ffccff', on2: '#ee33ee'},
            'Green': {on1: '#ccffcc', on2: '#22bb22'},
            'White': {on1: '#ffffff', on2: '#888888'},
            'Amber': {on1: '#ffffaa', on2: '#dd9900'},
        };
        $scope.renderModes.LED.drawCommands = function (colors) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = 'rgb(0, 0, 0)';
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                        var center = {};
                        center.x = x + pixelW / 2;
                        center.y = y + pixelH / 2;
                        var gradient = ctx.createRadialGradient(center.x, center.y + pixelH * 0.15, pixelH * 0.1, center.x, center.y, pixelH / 2 - 1);
                        gradient.addColorStop(0,   '#ffffff');
                        gradient.addColorStop(0.3, colors.on1);
                        gradient.addColorStop(1, colors.on2);
                        ctx.fillStyle = gradient;
                        ctx.shadowColor = colors.on1;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.shadowBlur = pixelH;
                        ctx.beginPath();
                        ctx.arc(center.x, center.y, pixelH / 2 - 1, 0, Math.PI*2); 
                        ctx.closePath();
                        ctx.fill();
                    ctx.restore();
                    ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        gradient = ctx.createRadialGradient(center.x - pixelH * 0.1, center.y - pixelH * 0.1, 1, center.x, center.y, pixelH / 2 - 1);
                        gradient.addColorStop(0,  '#eeeeee');
                        gradient.addColorStop(0.1,'#000000');
                        gradient.addColorStop(1,  '#222222');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(center.x, center.y, pixelH / 2 - 1, 0, Math.PI*2); 
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var center = {};
                    center.x = x + pixelW / 2;
                    center.y = y + pixelH / 2;
                    var gradient = ctx.createRadialGradient(center.x - pixelH * 0.1, center.y - pixelH * 0.1, 1, center.x, center.y, pixelH / 2 - 1);
                    gradient.addColorStop(0,  '#555555');
                    gradient.addColorStop(0.1,'#000000');
                    gradient.addColorStop(1,  '#222222');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, pixelH / 2 - 1, 0, Math.PI*2); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            };
        };

        $scope.renderModes["Stained Glass (Experimental)"] = {};
        $scope.renderModes["Stained Glass (Experimental)"].minSize = 16;
        $scope.renderModes["Stained Glass (Experimental)"].colors = {
            dual: true,
            set1: {
                "Black":           {c1: '#442244', c2: '#221122'},
                "White":           {c1: '#eeeeee', c2: '#e0e0e0'},
                "Red":             {c1: '#dd3333', c2: '#bb1111'},
                "Orange":          {c1: '#dd8844', c2: '#bb7f3d'},
                "Yellow":          {c1: '#dddd33', c2: '#bbbb11'},
                "Green":           {c1: '#33dd33', c2: '#11bb11'},
                "Blue":            {c1: '#9999dd', c2: '#8888bb'},
                "Purple":          {c1: '#dd33dd', c2: '#bb11bb'},
                "Pink":            {c1: '#dd8888', c2: '#bb8888'},
                "Dark Blue":       {c1: '#333377', c2: '#111177'},
                "Dark Green":      {c1: '#337733', c2: '#117711'},
                "Dark Red":        {c1: '#702226', c2: '#700408'},
                "Dark Purple":     {c1: '#773377', c2: '#601160'},
            },
            set2: {
                "Purple":          {c1: '#dd33dd', c2: '#bb11bb'},
                "Black":           {c1: '#442244', c2: '#221122'},
                "White":           {c1: '#eeeeee', c2: '#e0e0e0'},
                "Red":             {c1: '#dd3333', c2: '#bb1111'},
                "Orange":          {c1: '#dd8844', c2: '#bb7f3d'},
                "Yellow":          {c1: '#dddd33', c2: '#bbbb11'},
                "Green":           {c1: '#33dd33', c2: '#11bb11'},
                "Blue":            {c1: '#9999dd', c2: '#8888bb'},
                "Pink":            {c1: '#dd8888', c2: '#bb8888'},
                "Dark Blue":       {c1: '#333377', c2: '#111177'},
                "Dark Green":      {c1: '#337733', c2: '#117711'},
                "Dark Red":        {c1: '#702226', c2: '#700408'},
                "Dark Purple":     {c1: '#773377', c2: '#601160'},
            } 
        };
        $scope.renderModes["Stained Glass (Experimental)"].drawCommands = function (colors, colors2) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    var grad = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, h);
                    grad.addColorStop(0.1, '#ffffff');
                    grad.addColorStop(0.9, '#000000');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var center = {};
                    center.x = x + pixelW / 2;
                    center.y = y + pixelH / 2;
                    var grad = ctx.createLinearGradient(x, y, x + pixelW, y + pixelH);
                    grad.addColorStop(0.2, colors.c1);
                    grad.addColorStop(0.3, colors.c2);
                    grad.addColorStop(0.4, colors.c1);
                    grad.addColorStop(0.8, colors.c2);
                    grad.addColorStop(1.0, colors.c1);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, pixelW, pixelH);
                    ctx.strokeStyle = '#333333';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + pixelW - 1, y + 1);
                    ctx.lineTo(x + pixelW - 1, y + pixelH - 1);
                    ctx.lineTo(x + 1, y + pixelH - 1);
                    ctx.stroke();
                    ctx.fillStyle = grad;
                    ctx.globalAlpha = 0.75;
                    ctx.fillRect(x + 1, y + 1, pixelW - 3, pixelH - 3);
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var center = {};
                    center.x = x + pixelW / 2;
                    center.y = y + pixelH / 2;
                    var grad = ctx.createLinearGradient(x, y, x + pixelW, y + pixelH);
                    grad.addColorStop(0.2, colors2.c1);
                    grad.addColorStop(0.3, colors2.c2);
                    grad.addColorStop(0.4, colors2.c1);
                    grad.addColorStop(0.8, colors2.c2);
                    grad.addColorStop(1.0, colors2.c1);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, pixelW, pixelH);
                    ctx.strokeStyle = '#333333';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + pixelW - 1, y + 1);
                    ctx.lineTo(x + pixelW - 1, y + pixelH - 1);
                    ctx.lineTo(x + 1, y + pixelH - 1);
                    ctx.stroke();
                    ctx.fillStyle = grad;
                    ctx.globalAlpha = 0.75;
                    ctx.fillRect(x + 1, y + 1, pixelW - 3, pixelH - 3);
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                }
            };
        };

        $scope.renderModes["Toy Blocks"] = {};
        $scope.renderModes["Toy Blocks"].minSize = 12;
        $scope.renderModes["Toy Blocks"].colors = {
            dual: true,
            set1: {
                "Red":               {fg: '#ff0000'},
                "Green":             {fg: '#11aa44'},
                "Blue":              {fg: '#1166cc'},
                "White":             {fg: '#f8f8f8'},
                "Yellow":            {fg: '#eecc00'},
                "Pink":              {fg: '#ed8cc1'},
                "Sand":              {fg: '#ffeecc'},
                "Light Gray":        {fg: '#b4b4b4'},
                "Dark Gray":         {fg: '#777777'},
                "Light Bluish Gray": {fg: '#bbbbaa'},
                "Dark Bluish Gray":  {fg: '#77777f'},
                "Black":             {fg: '#222222'},
            },
            set2: {
                "White":             {bg: '#f8f8f8'},
                "Red":               {bg: '#ff0000'},
                "Green":             {bg: '#11aa44'},
                "Blue":              {bg: '#1166cc'},
                "Yellow":            {bg: '#eecc00'},
                "Pink":              {bg: '#ed8cc1'},
                "Sand":              {bg: '#ffeecc'},
                "Light Gray":        {bg: '#b4b4b4'},
                "Dark Gray":         {bg: '#777777'},
                "Light Bluish Gray": {bg: '#bbbbaa'},
                "Dark Bluish Gray":  {bg: '#77777f'},
                "Black":             {bg: '#222222'},
            }
        };
        $scope.renderModes["Toy Blocks"].drawCommands = function (colors, colors2) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors2.bg;
                    ctx.fillRect(0, 0, w, h);
                    ctx.restore();
                },
                on: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var center = {};
                    center.x = x + pixelW / 2;
                    center.y = y + pixelH / 2;
                    var grd1 = ctx.createLinearGradient(x, y, x+pixelW, y + pixelH);
                    grd1.addColorStop(0,   '#ffffff');
                    grd1.addColorStop(0.1, colors.fg);
                    grd1.addColorStop(1,   colors.fg);
                    var grd2 = ctx.createLinearGradient(x + pixelW *0.33, y + pixelH * 0.33, x + pixelW * 0.66, y + pixelH * 0.66);
                    grd2.addColorStop(0,    '#ffffff');
                    grd2.addColorStop(0.01, colors.fg);
                    grd2.addColorStop(1,    colors.fg);
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowOffsetX = pixelW / 8;
                    ctx.shadowOffsetY = pixelH / 8;
                    ctx.shadowBlur = pixelW / 3;
                    ctx.fillStyle = colors.fg;
                    ctx.fillRect(x, y, pixelW - 0.01, pixelH - 0.01);
                    ctx.shadowOffsetX = pixelW / 10;
                    ctx.shadowOffsetY = pixelH / 10;
                    ctx.shadowBlur = pixelW / 10;
                    ctx.fillStyle = grd2;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, pixelW / 3.3, 0, Math.PI*2); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var center = {};
                    center.x = x + pixelW / 2;
                    center.y = y + pixelH / 2;
                    var grd = ctx.createLinearGradient(x + pixelW *0.33, y + pixelH * 0.33, x + pixelW * 0.66, y + pixelH * 0.66);
                    grd.addColorStop(0,    '#ffffff');
                    grd.addColorStop(0.01, colors2.bg);
                    grd.addColorStop(1,    colors2.bg);
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowOffsetX = pixelW / 10;
                    ctx.shadowOffsetY = pixelH / 10;
                    ctx.shadowBlur = pixelW / 10;
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, pixelW / 3.3, 0, Math.PI*2); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            };
        };

        for (var i = 0; i < numFrames; i++) {
            drawing[i] = new SuperPixelGrid(w,h);
            drawing[i].fromUrlSafeBase64(base64Drawing.split('.')[i]);
        }
        var drawGif = function() {
            $scope.isReady = false;
            var container = $('#output');
            container.addClass('loading');
            var gif = new GIF({
              workers: 2,
              quality: 10,
              workerScript: '../assets/lib/gif.worker.js',
            });
            drawing.forEach(function (frame){
                var delay = $scope.delay;
                var drawCommands = {};
                if ($scope.modeUsesDualColors($scope.renderModes[$scope.renderMode])) {
                    drawCommands = $scope.renderModes[$scope.renderMode].drawCommands(
                        $scope.renderModes[$scope.renderMode].colors.set1[$scope.colors], 
                        $scope.renderModes[$scope.renderMode].colors.set2[$scope.colors2]
                        );
                } else {
                    drawCommands = $scope.renderModes[$scope.renderMode].drawCommands(
                        $scope.renderModes[$scope.renderMode].colors[$scope.colors]
                        );
                }
                var pixelScale = $scope.scale;    
                var canvas = document.createElement('canvas');
                canvas.width = w * pixelScale;
                canvas.height = h * pixelScale;
                var ctx = canvas.getContext('2d');
                frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, drawCommands);
                gif.addFrame(canvas, {delay: delay});
            });
            gif.on('finished', function(blob) {
                var img = $('<img>');
                $scope.dataUri = URL.createObjectURL(blob);
                img.attr('src', $scope.dataUri);
                container.empty();
                container.removeClass('loading');
                container.append(img);
                $scope.blob = blob;
                $scope.$apply(function () {$scope.isReady = true;});
            });
            gif.render();
        };
        drawGif();
}]);