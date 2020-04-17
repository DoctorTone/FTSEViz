/**
 * Created by atg on 28/01/2015.
 */
//Manage all the labels (sprites) for the website

import * as THREE from "three";
import { Label } from "./Label";

export class LabelManager {
    constructor() {
        this.labelProperties = {
            fontFace: "Arial",
            borderThickness: 0,
            backgroundColour: "rgba(255, 55, 55, 1.0)",
            borderColour: "rgba(0, 0, 0, 1.0)",
            textColour: "rgba(255, 255, 255, 1.0)",
            textLimit: 20,
            scale: new THREE.Vector3(50, 50, 1),
            position: new THREE.Vector3(),
            opacity: 1,
            fontSize: 32,
            visibility: false,
            radius: 20,
            rect: false,
            multiLine: false,
            horizSpacing: 20,
            vertSpacing: 5
        };

        this.labels = [];
        this.labelNames = [];
    }

    create(name, text, labelProperties) {
        //Create label
        for(let key in this.labelProperties) {
            if(!labelProperties[key]) {
                labelProperties[key] = this.labelProperties[key];
            }
        }
        let label = new Label(name, text, labelProperties);
        this.labels.push(label);
        this.labelNames.push(name);

        return label;
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
