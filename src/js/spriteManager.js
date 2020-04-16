/**
 * Created by atg on 28/01/2015.
 */
//Manage all the labels (sprites) for the website

let SpriteManager = function () {
    //Default values
    let defaultFontFace = "Arial";
    let defaultBorderThickness = 2;
    let backgroundColour = 'rgba(95, 95, 95, 0.5)';
    let borderColour = 'rgba(0, 0, 0, 1.0)';
    let textColour = 'rgba(255, 255, 255, 1.0)';
    let defaultFontSize = 24;
    let defaultVisibility = false;
    let defaultRadius = 20;
    let currentFontSize;

    let labels = [];
    let labelNames = [];

    const DAYS_PER_MONTH = 31;

    return {
        create: function(textLines, multiLine, position, scale, fontSize, opacity, visible, rect) {
            //Create label
            let canvas = document.createElement('canvas');
            let numLines = multiLine ? textLines.length : 1;
            let horizSpacing = 20, vertSpacing = 5;
            canvas.height = (fontSize * numLines) + vertSpacing + (defaultBorderThickness * 2);

            let context = canvas.getContext('2d');
            context.font = fontSize + "px " + defaultFontFace;

            let metrics = context.measureText( multiLine ? textLines[0] : textLines );
            let textWidth = metrics.width;
            canvas.width = textWidth + (defaultBorderThickness * 2) + horizSpacing;

            //Border
            context.lineWidth = defaultBorderThickness;
            context.fillStyle = textColour;
            context.font = fontSize + "px " + defaultFontFace;

            //Text
            let width = canvas.width;
            let height = canvas.height;
            let radius = defaultRadius;
            let border = defaultBorderThickness;
            if(rect) {
                roundRect(context, 0, 0, width, height, radius, border, backgroundColour);
            }
            let xStart = (canvas.width - textWidth)/2;
            let lineSpacing = fontSize + defaultBorderThickness + (vertSpacing/2);
            let interLineSpace = 2;
            context.fillStyle = textColour;
            for(let i=0; i<numLines; ++i) {
                context.fillText(multiLine ? textLines[i] : textLines, xStart, fontSize * (i+1));
                lineSpacing += (fontSize + interLineSpace);
            }

            // canvas contents will be used for a texture
            let texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            //texture.needsUpdate = true;
            let spriteMaterial = new THREE.SpriteMaterial({
                    transparent: false,
                    opacity: opacity,
                    map: texture}
            );

            let sprite = new THREE.Sprite(spriteMaterial);
            labels.push(sprite);
            sprite.index = labels.length-1;
            sprite.name = 'Label';
            labelNames.push(sprite.name);
            sprite.visible = visible;

            //let offset = (canvas.width - textWidth) / 80;
            sprite.position.copy(position);
            sprite.scale.set(scale.x, scale.y, 1);

            return sprite;
        },

        setBorderProperties: function(thickNess, colour) {
            defaultBorderThickness = thickNess != undefined ? thickNess : defaultBorderThickness;
            borderColour = colour != undefined ? 'rgba('+colour.r+','+colour.g+','+colour.b+','+colour.a+')' : borderColour;
        },

        setBorderColour: function(colour) {
            if(colour != undefined) {
                let red = Math.round(colour[0]);
                let green = Math.round(colour[1]);
                let blue = Math.round(colour[2]);

                borderColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        setBackgroundColour: function(colour) {
            if(colour != undefined) {
                let red = Math.round(colour[0]);
                let green = Math.round(colour[1]);
                let blue = Math.round(colour[2]);

                backgroundColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        setTextColour: function(colour) {
            if(colour != undefined) {
                let red = Math.round(colour[0]);
                let green = Math.round(colour[1]);
                let blue = Math.round(colour[2]);

                textColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
            }
        },

        getSprite: function(name) {
            for(let i=0; i<labelNames.length; ++i) {
                if(labelNames[i] === name) {
                    return labels[i];
                }
            }

            return null;
        },

        getSpriteByIndex: function(index) {
            for(let i=0; i<labels.length; ++i) {
                if(labels[i].index === index) {
                    return labels[i];
                }
            }

            return null;
        },

        getSpriteByDate: function(day, group) {
            let index = group * DAYS_PER_MONTH * 2;
            index += ((day * 2) + 1);
            if(index >= labels.length) {
                console.log("Invalid sprite index");
                return;
            }

            return labels[index];
        },

        setText: function(sprite, text) {
            for(let i=0; i<labels.length; ++i) {
                if(labels[i] === sprite) {
                    break;
                }
            }
            let canvas = labels[i].material.map.image;
            let context = canvas.getContext('2d');
            let metrics = context.measureText( text );
            let textWidth = metrics.width;
            let offset = (CANVAS_WIDTH - (textWidth + defaultBorderThickness))/2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(text, defaultBorderThickness + offset, currentFontSize + defaultBorderThickness);
            labels[i].material.map.needsUpdate = true;
        },

        setTextAmount: function(sprite, text) {
            for(let i=0; i<labels.length; ++i) {
                if(labels[i] === sprite) {
                    break;
                }
            }
            let amount = text.toFixed(2);
            amount = '£'+amount;
            let canvas = labels[i].material.map.image;
            let context = canvas.getContext('2d');
            let metrics = context.measureText( amount );
            let textWidth = metrics.width;
            let offset = (CANVAS_WIDTH - (textWidth + defaultBorderThickness))/2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(amount, defaultBorderThickness + offset, currentFontSize + defaultBorderThickness);
            labels[i].material.map.needsUpdate = true;
        },

        hideLabels: function() {
            for(let i=0; i<labels.length; ++i) {
                labels[i].visible = false;
            }
        },

        setVisibility(status) {

        },

        setText(name, text) {
            let label = this.getSprite(name);
            if(label) {

            }
        }
    };
};

// function for drawing rounded rectangles
function roundRect(ctx, xStart, yStart, width, height, radius, lineWidth, fillColour)
{
    let halfWidth = lineWidth/2;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(xStart + radius + halfWidth, yStart + halfWidth);
    ctx.lineTo(xStart + width - radius - halfWidth, yStart + halfWidth);
    ctx.arc(xStart + width - radius - halfWidth, radius + halfWidth, radius, -Math.PI/2, 0);
    ctx.lineTo(xStart + width - halfWidth, height - radius - halfWidth);
    ctx.arc(width - radius - halfWidth, height - radius - halfWidth, radius, 0, Math.PI/2);
    ctx.lineTo(xStart + radius + halfWidth, height - halfWidth);
    ctx.arc(xStart + radius + halfWidth, height - radius - halfWidth, radius, Math.PI/2, Math.PI);
    ctx.lineTo(xStart + halfWidth, yStart + radius + halfWidth);
    ctx.arc(xStart + radius + halfWidth, yStart + radius + halfWidth, radius, Math.PI, -Math.PI/2);
    ctx.stroke();
    ctx.fillStyle = fillColour;
    ctx.fill();
    ctx.closePath();
}
