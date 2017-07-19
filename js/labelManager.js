/**
 * Created by atg on 28/01/2015.
 */
//Manage all the labels (sprites) for the website

class LabelManager {
    constructor() {
        this.defaultFontFace = "Arial";
        this.defaultBorderThickness = 0;
        this.backgroundColour = 'rgba(55, 55, 55, 1.0)';
        this.borderColour = 'rgba(0, 0, 0, 1.0)';
        this.textColour = 'rgba(255, 255, 255, 1.0)';
        this.defaultFontSize = 24;
        this.defaultVisibility = false;
        this.defaultRadius = 20;
        this.labels = [];
        this.labelNames = [];
    }

    create(name, textLimit, colour, position, scale, fontSize, opacity, visible, rect) {
        //Create label
        if(colour !== undefined) {
            let red = colour.color.r * 255;
            let green = colour.color.g * 255;
            let blue = colour.color.b * 255;
            this.textColour = 'rgba('+red+', '+green+', '+blue+', 1.0)';
        }
        let canvas = document.createElement('canvas');
        if(textLimit > 0) {
            if(name.length > textLimit) {
                name = name.substr(0, textLimit);
            }
        }
        let spriteName = ' ' + name + ' ';
        canvas.width = 400;

        let context = canvas.getContext('2d');
        context.font = fontSize + "px " + this.defaultFontFace;


        let metrics = context.measureText( spriteName );
        let textWidth = metrics.width;

        //Background
        context.fillStyle = this.backgroundColour;
        //Border
        context.strokeStyle = this.borderColour;
        context.lineWidth = this.defaultBorderThickness;

        //Draw rounded rectangle
        //Position text in centre of canvas
        let offset = (canvas.width - (textWidth + this.defaultBorderThickness))/2;
        if(rect) {
            roundRect(context, offset, this.defaultBorderThickness/2, this.defaultBorderThickness/2, textWidth + this.defaultBorderThickness, fontSize * 1.4 + this.defaultBorderThickness, this.defaultRadius);
        }

        //Text
        if(colour !== null) {

        }
        context.fillStyle = this.textColour;
        context.fillText( spriteName, this.defaultBorderThickness + offset, fontSize+30 + this.defaultBorderThickness);

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
        this.labels.push(sprite);
        sprite.name = name + 'Label';
        this.labelNames.push(name);
        sprite.visible = visible;

        //var offset = (canvas.width - textWidth) / 80;
        sprite.position.set(position.x, position.y, position.z);
        sprite.scale.set(scale.x, scale.y, 1);

        return sprite;
    }

    setBorderProperties(thickNess, colour) {
        this.defaultBorderThickness = thickNess !== undefined ? thickNess : this.defaultBorderThickness;
        this.borderColour = colour !== undefined ? 'rgba('+colour.r+','+colour.g+','+colour.b+','+colour.a+')' : this.borderColour;
    }

    setBorderColour(colour) {
        if(colour !== undefined) {
            let red = Math.round(colour[0]);
            let green = Math.round(colour[1]);
            let blue = Math.round(colour[2]);

            this.borderColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
        }
    }

    setBackgroundColour(colour) {
        if(colour !== undefined) {
            let red = Math.round(colour[0]);
            let green = Math.round(colour[1]);
            let blue = Math.round(colour[2]);

            this.backgroundColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
        }
    }

    setTextColour(colour) {
        if(colour !== undefined) {
            let red = Math.round(colour[0]);
            let green = Math.round(colour[1]);
            let blue = Math.round(colour[2]);

            this.textColour = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
        }
    }

    getLabel(name) {
        for(let i=0; i<this.labelNames.length; ++i) {
            if(this.labelNames[i] === name) {
                return this.labels[i];
            }
        }

        return null;
    }
}

// function for drawing rounded rectangles
function roundRect(ctx, offset, x, y, w, h, r)
{
    x += offset;
    y += 30;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
