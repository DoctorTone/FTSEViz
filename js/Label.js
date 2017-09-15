/**
 * Created by tonyg on 20/07/2017.
 */

//Implementation for Sprite class

class Label {
    constructor(name, textLines, labelProperties) {
        //Create label
        this.labelProperties = labelProperties;
        let canvas = document.createElement('canvas');
        this.canvas = canvas;
        let multiLine = labelProperties.multiLine;
        let numLines = multiLine ? textLines.length : 1;
        let horizSpacing = labelProperties.horizSpacing, vertSpacing = labelProperties.vertSpacing;
        let borderThickness = labelProperties.borderThickness;
        let fontSize = labelProperties.fontSize;
        let fontFace = labelProperties.fontFace;
        let textColour = labelProperties.textColour;

        canvas.height = (fontSize * numLines) + vertSpacing + (borderThickness * 2);

        let context = canvas.getContext('2d');
        this.context = context;
        context.font = fontSize + "px " + fontFace;

        let metrics = context.measureText( multiLine ? textLines[0] : textLines );
        let textWidth = metrics.width;
        canvas.width = textWidth + (borderThickness * 2) + horizSpacing;

        //Border
        context.lineWidth = borderThickness;
        context.fillStyle = textColour;
        context.font = fontSize + "px " + fontFace;

        //Text
        let width = canvas.width;
        let height = canvas.height;
        let radius = labelProperties.radius;
        let backgroundColour = labelProperties.backgroundColour;
        if(labelProperties.rect) {
            this.roundRect(context, 0, 0, width, height, radius, borderThickness, backgroundColour);
        }
        let xStart = (canvas.width - textWidth)/2;
        let lineSpacing = fontSize + borderThickness + (vertSpacing/2);
        let interLineSpace = 2;
        context.fillStyle = textColour;
        for(let i=0; i<numLines; ++i) {
            context.fillText(multiLine ? textLines[i] : textLines, xStart, fontSize * (i+1));
            lineSpacing += (fontSize + interLineSpace);
        }

        // canvas contents will be used for a texture
        let texture = new THREE.Texture(canvas);
        this.texture = texture;
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        //texture.needsUpdate = true;
        let spriteMaterial = new THREE.SpriteMaterial({
            transparent: false,
            opacity: labelProperties.opacity,
            map: texture}
        );

        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.name = name;
        sprite.visible = labelProperties.visibility;

        sprite.position.copy(labelProperties.position);
        sprite.scale.copy(labelProperties.scale);
        this.sprite = sprite;
    }

    getSprite() {
        return this.sprite;
    }

    setVisibility(status) {
        this.sprite.visible = status;
    }

    setWorldPosition(matrix) {
        this.sprite.position.setFromMatrixPosition(matrix);
    }

    updateY(yScale) {
        this.sprite.position.y *= yScale;
    }

    offsetY(offset) {
        this.sprite.position.y += offset;
    }

    setText(text) {
        let context = this.context;
        let props = this.labelProperties;
        let metrics = context.measureText( text );
        let textWidth = metrics.width;
        this.canvas.width = textWidth + (props.borderThickness * 2) +
            props.horizSpacing;
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let xStart = (this.canvas.width - textWidth)/2;
        context.lineWidth = props.borderThickness;
        context.fillStyle = props.textColour;
        context.font = props.fontSize + "px " + props.fontFace;
        context.fillText( text, xStart, props.fontSize);
        this.texture.needsUpdate = true;
    }

    // function for drawing rounded rectangles
    roundRect(ctx, xStart, yStart, width, height, radius, lineWidth, fillColour)
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
}