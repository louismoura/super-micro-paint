var SuperPixelGrid = function (w, h, initArray) {
    if (!(this instanceof SuperPixelGrid)) {
        return new SuperPixelGrid(w, h, initArray);
    }
    Array2d.call(this, w, h, initArray);
};
SuperPixelGrid.prototype = new Array2d();
SuperPixelGrid.prototype.constructor = SuperPixelGrid;
SuperPixelGrid.prototype.setPixel = function (x, y, color) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.set(x, y, color);
    }
};
SuperPixelGrid.prototype.togglePixel = function (x, y) {
    this.setPixel(x, y, !this.get(x, y));
    return this;
};
SuperPixelGrid.prototype.nudge = function (xOffset, yOffset) {
    var self = this;
    var nudged = self.map(function (value, x, y) {
        return self.get((x + self.width - xOffset) % self.width, (y + self.height - yOffset) % self.height);
    });
    this.rawArray = nudged.rawArray.slice(0);
    return this;
};
SuperPixelGrid.prototype.invert = function (xOffset, yOffset) {
    var self = this;
    var inverse = self.map(function (value) {
        return !value;
    });
    this.rawArray = inverse.rawArray.slice(0);
    return this;
};
SuperPixelGrid.prototype.drawLine = function (x0, y0, x1, y1, color) {
    var self = this;
    self.forLine(x0, y0, x1, y1, function (val, x, y) {
        self.setPixel(x, y, color);
    });
    return this;
};
SuperPixelGrid.prototype.drawRectangle = function (x0, y0, x1, y1, color) {
    this.drawLine(x0, y0, x1, y0, color);
    this.drawLine(x1, y0, x1, y1, color);
    this.drawLine(x1, y1, x0, y1, color);
    this.drawLine(x0, y1, x0, y0, color);
    return this;
};
SuperPixelGrid.prototype.drawEllipse = function (x0, y0, x1, y1, color) {
    var self = this;
    x0 = 2 * x0 - x1;
    y0 = 2 * y0 - y1;
    y0--;
    y1--;
    var plot4EllipsePoints = function (x, y, color) {
        self.setPixel(x0 + x, y0 + y, color);
        self.setPixel(x0 - x, y0 + y, color);
        self.setPixel(x0 - x, y0 - y, color);
        self.setPixel(x0 + x, y0 - y, color);
    };
    var a = Math.abs(x1 - x0);
    var b = Math.abs(y1 - y0);
    var b1 = b % 2;
    var dx = 4 * (1 - a) * b * b;
    var dy = 4 * (b1 + 1) * a * a;
    var err = dx + dy + b1 * a * a;
    var e2;
    if (x0 > x1) {
        x0 = x1;
        x1 += a;
    }
    if (y0 > y1) {
        y0 = y1;
    }
    y0 += Math.round((b + 1) / 2);
    y1 = y0 - b1;
    a = a * 8 * a;
    b1 = 8 * b * b;
    do {
        self.setPixel(x1, y0, color);
        self.setPixel(x0, y0, color);
        self.setPixel(x0, y1, color);
        self.setPixel(x1, y1, color);
        e2 = 2 * err;
        if (e2 <= dy) {
            y0++;
            y1--;
            err += dy += a;
        }
        if (e2 >= dx || 2 * err > dy) {
            x0++;
            x1--;
            err += dx += b1;
        }
    } while (x0 <= x1);
    while (y0 - y1 < b) {
        self.setPixel(x0 - 1, y0, color);
        self.setPixel(x1 + 1, y0++, color);
        self.setPixel(x0 - 1, y1, color);
        self.setPixel(x1 + 1, y1--, color);
    }
};
SuperPixelGrid.prototype.floodFill = function (x, y, color) {
    // if pixel is already toggled, stop
    if (this.get(x, y) != color) {
        this.setPixel(x, y, color);
        // fill up
        if (y > 0) {
            this.floodFill(x, y - 1, color);
        }
        // fill down
        if (y < this.height - 1) {
            this.floodFill(x, y + 1, color);
        }
        // fill left
        if (x > 0) {
            this.floodFill(x - 1, y, color);
        }
        // fill right
        if (x < this.width - 1) {
            this.floodFill(x + 1, y, color);
        }
    }
    return this;
};
SuperPixelGrid.prototype.lifeStep = function () {
    var self = this;
    var newFrame = self.map(function (value, x, y, w, h) {
        var neighbors = [];
        if (x > 0) {
            if (y > 0) {
                neighbors.push(self.get(x - 1, y - 1));
            }
            neighbors.push(self.get(x - 1, y));
            if (y < self.height - 1) {
                neighbors.push(self.get(x - 1, y + 1));
            }
        }
        if (y > 0) {
            neighbors.push(self.get(x, y - 1));
        }
        if (y < self.height - 1) {
            neighbors.push(self.get(x, y + 1));
        }
        if (x < self.width - 1) {
            if (y > 0) {
                neighbors.push(self.get(x + 1, y - 1));
            }
            neighbors.push(self.get(x + 1, y));
            if (y < self.height + 1) {
                neighbors.push(self.get(x + 1, y + 1));
            }
        }
        var liveNeighbors = neighbors.map(function (isTrue) {
                return isTrue ? 1 : 0;
            }) //map bool to int
            .reduce(function (a, b) {
                return a + b;
            }); //sum
        if (value === true) { // this cell is 'alive'
            if (liveNeighbors < 2 || liveNeighbors > 3) {
                return false;
            } else {
                return true;
            }
        } else { //this cell is 'dead'
            if (liveNeighbors === 3) {
                return true;
            } else {
                return false;
            }
        }
    });
    this.rawArray = newFrame.rawArray.slice();
    return this;
};
SuperPixelGrid.prototype.toString = function () {
    return this.rawArray.map(function (n) {
            return n ? 1 : 0;
        })
        .join('');
};
SuperPixelGrid.prototype.fromString = function (s) {
    var rawArray = s.split("")
        .map(function (n) {
            return n == 1;
        });
    this.rawArray = rawArray.slice();
    return this;
};
SuperPixelGrid.prototype.toUrlSafeBase64 = function () {
    var dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split('');
    var rlEncode = function (s) {
        var flag = "~";
        var maxRun = 68;
        var minRun = 4;
        var len = s.length;
        var encodedString = "";
        var runLength, i;
        for (i = 0; i < len; i++) {
            encodedString += s[i];
            runLength = 1;
            while (i + 1 < len && s[i] == s[i + 1] && runLength < maxRun - 1)
            {   
                runLength++;
                i++;
            }
            if (runLength >= minRun) {
                encodedString += flag + dictionary[runLength - minRun];
            } else {
                i = i - runLength + 1;
            }
        }
        return encodedString;
    };
    var bits = this.rawArray.map(function (n) {
            return n ? 1 : 0;
        })
        .slice();
    var str = "";
    while (bits.length % 6 !== 0) {
        bits.push("0");
    }
    while (bits.length > 0) {
        var sixBits = bits.splice(0, 6);
        str += dictionary[parseInt(sixBits.join(''), 2)];
    }
    return rlEncode(str);
};

SuperPixelGrid.prototype.fromUrlSafeBase64 = function (str) {
    var dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split('');
    var rlDecode = function (s) {
        var flag = "~";
        var minRun = 4;
        var len = s.length;
        decodedString = "";
        var i, j, runLength;
        for (i = 0; i < len; i++) {
            decodedString += s[i];
            if (i + 1 < len && s[i + 1] === flag) {
                runLength = dictionary.indexOf(s[i+2]) + minRun - 1;
                for(j = 0; j < runLength; j++) {
                    decodedString += s[i];
                }
                i += 2;
            }
        }
        return decodedString;
    };
    str = rlDecode(str);
    var rawArray = [];
    for (var i = 0; i < str.length; i++) {
        var char = str[i];
        var sixBits = dictionary.indexOf(char)
            .toString(2);
        var pad = "000000";
        sixBits = pad.substring(0, pad.length - sixBits.length) + sixBits;
        var bitArray = sixBits.split('')
            .map(function (n) {
                return n == 1;
            });
        rawArray = rawArray.concat(bitArray);
    }
    this.rawArray = rawArray.slice(0, this.width * this.height);
    return str;
};
SuperPixelGrid.prototype.drawToCanvas = function (w, h, pixelW, pixelH, canvas, drawCommands, overlay, turbo) {
    var ctx = canvas.getContext('2d');
    var self = this;
    var blinkState = (Math.floor(Date.now() / 400) % 2 === 1);
    drawCommands.bg.call(null, w, h, ctx);
    var drawPixels = function(state) {
        self.forEach(function drawPixel(value, x, y) {
            if (overlay && overlay.get(x, y)) {
                value = blinkState;
            }
            if (value === state) {
                var x0 = x * pixelW;
                var y0 = y * pixelH;
                var drawPix = value ? drawCommands.on : drawCommands.off;
                drawPix.call(null, x0, y0, pixelW, pixelH, ctx);
            }
        });
    };
    if (turbo) {
        ctx.save();
        drawCommands.preOff(ctx);
        drawPixels(false); // Draw all 'off' pixels
        ctx.restore();
        ctx.save();
        drawCommands.preOn(ctx);
        drawPixels(true);  // Then draw all 'on' pixels
        ctx.restore();
    } else {
        drawPixels(false); // Draw all 'off' pixels
        drawPixels(true);  // Then draw all 'on' pixels
    }
};