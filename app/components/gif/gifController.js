angular.module('super-micro-paint', ['touch-directives'])
    .controller('gifController', ['$scope', function ($scope) {

        var getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        $scope.renderMode = 'LCD';
        $scope.colors = 'Super Micro Paint';
        $scope.delay = 400;
        $scope.scale = 15;
        $scope.invert = false;
        var h = 16;
        var w = 32;

        $scope.modeChanged = function() {
            if ($scope.scale < $scope.renderModes[$scope.renderMode].minSize) {
                $scope.scale = $scope.renderModes[$scope.renderMode].minSize;
            }
            $scope.colors = Object.keys($scope.renderModes[$scope.renderMode].colors)[0];
            drawGif();
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

        var numFrames = 4;
        var drawing = [];
        var inverse = [];
        var base64Drawing = getParameterByName('smp');

        $scope.renderModes = {};

        $scope.renderModes.LCD = {};
        $scope.renderModes.LCD.minSize = 1;
        $scope.renderModes.LCD.colors = {
            'Super Micro Paint': {bg: '#DCF0E6', on: 'rgba(40, 40, 40, 0.85)', off: 'rgba(40, 40, 40, 0.05)'},
            'Green Boy': {bg: '#D8D8C0', on: '#113711', off: 'rgba(40, 40, 40, 0.05)'},
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
                    var small = pixelW <= 6;
                    var shadowSize = small ? 0 : 1;
                    ctx.fillStyle = colors.on;
                    ctx.shadowOffsetX = shadowSize;
                    ctx.shadowOffsetY = shadowSize;
                    ctx.shadowBlur =  shadowSize * 2;
                    ctx.shadowColor = '#888';
                    ctx.fillRect(x + shadowSize, y + shadowSize, pixelW - shadowSize * 2, pixelH - shadowSize * 2);
                    ctx.restore();
                },
                off: function (x, y, pixelW, pixelH, ctx) {
                    ctx.save();
                    var small = pixelW <= 6;
                    var gapSize = small ? 0 : 1;
                    ctx.fillStyle = colors.off;
                    ctx.fillRect(x + gapSize, y + gapSize, pixelW - gapSize * 2, pixelH - gapSize * 2);              
                    ctx.restore();
                }
            };
        };

        $scope.renderModes.VFD = {};
        $scope.renderModes.VFD.minSize = 4;
        $scope.renderModes.VFD.colors = {
            'Flourescent Blue': {bg: 'rgb(0, 0, 0)', on: 'rgb(128, 240, 240)', off: 'rgb(10, 20, 20)'},
            'Flourescent Green': {bg: 'rgb(0, 0, 0)', on: 'rgb(128, 255, 128)', off: 'rgb(10, 20, 10)'},
            'Flourescent Red':   {bg: 'rgb(0, 0, 0)', on: 'rgb(255, 96, 64)', off: 'rgb(20, 10, 10)'},
            'Flourescent Amber':  {bg: 'rgb(0, 0, 0)', on: 'rgb(255, 191, 60)', off: 'rgb(20, 15, 10)'},
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
        $scope.renderModes.LED.minSize = 10;
        $scope.renderModes.LED.colors = {
            'Red': {on1: '#ff6b6b', on2: '#660000', off: '#330000'},
            'Blue': {on1: '#9bddff', on2: '#006699', off: '#002233'},
            'White': {on1: '#ffffff', on2: '#cccccc', off: '#333333'},
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
                        var gradient = ctx.createRadialGradient(center.x, center.y + pixelH * 0.15, pixelH * 0.1, center.x, center.y, pixelH / 2 - 2);
                        gradient.addColorStop(0,   '#ffffff');
                        gradient.addColorStop(0.3, colors.on1);
                        gradient.addColorStop(1, colors.on2);
                        ctx.fillStyle = gradient;
                        ctx.shadowColor = colors.on1;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.shadowBlur = pixelH;
                        ctx.beginPath();
                        ctx.arc(center.x, center.y, pixelH / 2 - 2, 0, Math.PI*2); 
                        ctx.closePath();
                        ctx.fill();
                    ctx.restore();
                    ctx.save();
                        ctx.globalCompositeOperation = 'lighter';
                        var gradient = ctx.createRadialGradient(center.x - pixelH * 0.1, center.y - pixelH * 0.1, 1, center.x, center.y, pixelH / 2 - 2);
                        gradient.addColorStop(0,  '#eeeeee');
                        gradient.addColorStop(0.1,'#000000');
                        gradient.addColorStop(1,  '#222222');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(center.x, center.y, pixelH / 2 - 2, 0, Math.PI*2); 
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
                    var gradient = ctx.createRadialGradient(center.x - pixelH * 0.1, center.y - pixelH * 0.1, 1, center.x, center.y, pixelH / 2 - 2);
                    gradient.addColorStop(0,   colors.on2);
                    gradient.addColorStop(0.1, colors.off);
                    gradient.addColorStop(1,  '#222222');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, pixelH / 2 - 2, 0, Math.PI*2); 
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            };
        };

        $scope.renderModes.block = {};
        $scope.renderModes.block.minSize = 8;
        $scope.renderModes.block.colors = {
            Red:    {bg: '#f5f5f5', fg: '#ff0000'},
            Blue:   {bg: '#f5f5f5', fg: '#0066dd'},
            Yellow: {bg: '#f5f5f5', fg: '#eecc00'},
        };
        $scope.renderModes.block.drawCommands = function (colors) {
            return {
                bg: function (w, h, ctx) {
                    ctx.save();
                    ctx.fillStyle = colors.bg;
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
                    grd.addColorStop(0.01, colors.bg);
                    grd.addColorStop(1,    colors.bg);
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
            drawing[i].fromUrlSafeBase64(base64Drawing.slice(i * 86));
        }
        var drawGif = function() {
            var container = $('#output');
            container.addClass('loading');
            var gif = new GIF({
              workers: 4,
              quality: 1,
              workerScript: '../assets/lib/gif.worker.js',
            });
            drawing.forEach(function (frame){
                var delay = $scope.delay;
                var drawCommands = $scope.renderModes[$scope.renderMode].drawCommands($scope.renderModes[$scope.renderMode].colors[$scope.colors]);
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
                img.attr('src', URL.createObjectURL(blob));
                container.empty();
                container.removeClass('loading');
                container.append(img);
            });
            gif.render();
        };
        drawGif();
}]);