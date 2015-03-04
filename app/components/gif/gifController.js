angular.module('super-micro-paint', ['touch-directives'])
    .controller('gifController', ['$scope', function ($scope) {

        var getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        $scope.renderMode = 0;
        $scope.delay = 400;
        $scope.scale = 15;
        $scope.color = 0;

        var h = 16;
        var w = 32;

        $scope.scales = [];
        for (i = 1; i <= 16; i++) {
            var s = {
                'label': i + "x (" + w * i + " x " + h * i + ")",
                'scale' : i,
            };
            $scope.scales.push(s);
        }
        $scope.renderModes = [
            {'label':'LCD', 'mode':0},  
            {'label':'VFD', 'mode':1}, 
            {'label':'LED', 'mode':2},  
        ];
        var numFrames = 4;
        var drawing = [];
        var base64Drawing = getParameterByName('smp');

        var draw = {};
        draw.bg = [];
        draw.on = [];
        draw.off = [];
        draw.bg[0] = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = '#DCF0E6';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        draw.on[0] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
            ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowBlur = 2;
            ctx.shadowColor = '#888';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
            ctx.restore();
        };
        draw.off[0] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.05)';
            ctx.fillStyle = 'rgba(40, 40, 40, 0.05)';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);              
            ctx.restore();
        };

        draw.bg[1] = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        draw.on[1] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(128, 240, 240, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(128, 240, 240, 1)';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
            ctx.restore();
        };
        draw.off[1] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(10, 10, 10, 1)';
            ctx.fillRect(x + 1, y + 1, pixelW - 2, pixelH - 2);
            ctx.restore();        
        };

        draw.bg[2] = function (w, h, ctx) {
            ctx.save();
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        };
        draw.on[2] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var center = {};
            center.x = x + pixelW / 2;
            center.y = y + pixelH / 2;
            ctx.fillStyle = 'rgba(230, 120, 120, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(240, 100, 100, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, pixelW / 2 - 2, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(240, 220, 220, 0.5)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0.5;
            ctx.shadowColor = 'rgba(240, 220, 220, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y - 1, pixelW / 8, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        draw.off[2] = function (x, y, pixelW, pixelH, ctx) {
            ctx.save();
            var center = {};
            center.x = x + pixelW / 2;
            center.y = y + pixelH / 2;
            ctx.fillStyle = 'rgba(15, 15, 15, 1)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 1;
            ctx.shadowColor = 'rgba(240, 240, 240, .6)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, pixelW / 2 - 2, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(240, 220, 220, 0.5)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0.5;
            ctx.shadowColor = 'rgba(240, 220, 220, 1)';
            ctx.beginPath();
            ctx.arc(center.x, center.y - 1, pixelW / 16, 0, Math.PI*2); 
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        for (var i = 0; i < numFrames; i++) {
            drawing[i] = new SuperPixelGrid(w,h);
            drawing[i].fromUrlSafeBase64(base64Drawing.slice(i * 86));
        }
        $scope.drawGif = function() {
            var elem = document.querySelector('#output');
            var gif = new GIF({
              workers: 2,
              quality: 1,
              workerScript: '../assets/lib/gif.worker.js',
            });
            drawing.forEach(function (frame){
                var delay = $scope.delay;
                var drawmode = $scope.renderMode;
                var pixelScale = $scope.scale;    
                var canvas = document.createElement('canvas');
                canvas.width = w * pixelScale;
                canvas.height = h * pixelScale;
                var ctx = canvas.getContext('2d');
                frame.drawToCanvas(canvas.width, canvas.height, pixelScale, pixelScale, canvas, draw.bg[drawmode], draw.off[drawmode], draw.on[drawmode]);
                gif.addFrame(canvas, {delay: delay});
            });
            gif.on('finished', function(blob) {
                var img = document.createElement('img');
                img.setAttribute('src', URL.createObjectURL(blob));
                while (elem.firstChild) {
                    elem.removeChild(elem.firstChild);
                }
                elem.appendChild(img);
            });
            gif.render();
        };
        $scope.drawGif();
}]);