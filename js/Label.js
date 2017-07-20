/**
 * Created by tonyg on 20/07/2017.
 */

//Implementation for Sprite class

class Label {
    constructor(name, text, position, labelProperties) {
        const CANVAS_WIDTH = 400;
        this.textLimit = 20;
        this.canvas = document.createElement('canvas');
        if(text.length > this.textLimit) {
            text = text.substr(0, this.textLimit);
        }

        let spriteName = name;
        this.canvas.width = CANVAS_WIDTH;

        this.context = this.canvas.getContext('2d');
        this.context.font = labelProperties.fontSize + "px " + labelProperties.fontFace;

        let metrics = this.context.measureText( text );
        let textWidth = metrics.width;

        //Background
        this.context.fillStyle = labelProperties.backgroundColour;
        //Border
        this.context.strokeStyle = labelProperties.borderColour;
        this.context.lineWidth = labelProperties.borderThickness;

        //Draw rounded rectangle
        //Position text in centre of canvas
        let offset = (this.canvas.width - (textWidth + labelProperties.borderThickness))/2;
        /*
         if(rect) {
         roundRect(context, offset, this.defaultBorderThickness/2, this.defaultBorderThickness/2, textWidth + this.defaultBorderThickness, fontSize * 1.4 + this.defaultBorderThickness, this.defaultRadius);
         }
         */

        //Text
        this.context.fillStyle = labelProperties.textColour;
        this.context.fillText( text, labelProperties.borderThickness + offset, labelProperties.fontSize+30 +
            labelProperties.borderThickness);

        // canvas contents will be used for a texture
        let texture = new THREE.Texture(this.canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        //texture.needsUpdate = true;
        let spriteMaterial = new THREE.SpriteMaterial({
            transparent: false,
            opacity: labelProperties.opacity,
            map: texture}
        );

        this.sprite = new THREE.Sprite(spriteMaterial);

        this.sprite.name = name;

        this.sprite.visible = labelProperties.visibility;

        //var offset = (canvas.width - textWidth) / 80;
        this.sprite.position.copy(position);
        this.sprite.scale.copy(labelProperties.scale);
        this.texture = texture;

        this.labelProperties = labelProperties;
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

    setText(text) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let metrics = this.context.measureText( text );
        let textWidth = metrics.width;
        let offset = (this.canvas.width - (textWidth + this.labelProperties.borderThickness))/2;
        this.context.fillText( text, this.labelProperties.borderThickness + offset, this.labelProperties.fontSize+30 +
            this.labelProperties.borderThickness);
        this.texture.needsUpdate = true;
    }
}