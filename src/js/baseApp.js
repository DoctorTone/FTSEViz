/**
 * Created by atg on 14/05/2014.
 */
//Common baseline for visualisation app

import * as SCENE from "./sceneConfig";
import * as THREE from "three";
//let TrackballControls = require("three-trackballcontrols");
var TrackballControls = require('three-trackballcontrols');

export class BaseApp {
    constructor() {
        this.renderer = null;
        this.scenes = [];
        this.currentScene = 0;
        this.camera = null;
        this.controls = null;
        this.stats = null;
        this.container = null;
        this.objectList = [];
        this.mouse = new THREE.Vector2();
        this.pickedObjects = [];
        this.selectedObject = null;
        this.draggableObjects = [];
        this.draggedObject = null;
        this.hoverObjects = [];
        this.startTime = 0;
        this.elapsedTime = 0;
        this.clock = new THREE.Clock();
        this.clock.start();
        this.raycaster = new THREE.Raycaster();
        this.objectsPicked = false;
        this.tempVector = new THREE.Vector3();
        this.cameraRotation = 0
    }

    init(container) {
        this.container = container;
        this.createRenderer();
        this.createCamera();
        this.createControls();
        /*
        this.stats = new Stats();
        container.appendChild(this.stats.dom);
        */
        this.statsShowing = false;
        //$("#Stats-output").hide();
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer( {antialias : true, alpha: true});
        //this.renderer.setClearColor(0x5c5f64, 1.0);
        this.renderer.shadowMap.enabled = true;
        let isMSIE = /*@cc_on!@*/0;

        let width = this.container.clientWidth;
        if (isMSIE) {
            // do IE-specific things
            width = window.innerWidth;
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild( this.renderer.domElement );

        window.addEventListener('keydown', event => {
            this.keyDown(event);
        }, false);

        window.addEventListener('resize', event => {
            this.windowResize(event);
        }, false);

        document.addEventListener("mousemove", event => {
            this.mouseMoved(event);
        }, false);
    }

    keyDown(event) {
        //Key press functionality
        switch(event.keyCode) {
            case 83: //'S'
                if (this.stats) {
                    if (this.statsShowing) {
                        $("#Stats-output").hide();
                        this.statsShowing = false;
                    } else {
                        $("#Stats-output").show();
                        this.statsShowing = true;
                    }
                }
                break;
            case 80: //'P'
                console.log('Cam =', this.camera.position);
                console.log('Look =', this.controls.getLookAt());
        }
    }

    mouseClicked(event) {
        //Update mouse state
        event.preventDefault();
        this.pickedObjects.length = 0;

        if(event.type == 'mouseup') {
            this.mouse.endX = event.clientX;
            this.mouse.endY = event.clientY;
            this.mouse.down = false;
            this.objectsPicked = false;
            return;
        }
        this.mouse.set((event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1);
        this.mouse.down = true;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let intersects = this.raycaster.intersectObjects( this.scenes[this.currentScene].children, true );
        if(intersects.length > 0) {
            this.selectedObject = intersects[0].object;
            //DEBUG
            console.log("Picked = ", this.selectedObject);
        }
    }

    mouseMoved(event) {
        //Update mouse state
        event.preventDefault();
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    windowResize(event) {
        //Handle window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight);
        this.fitToScreen();
    }

    createScene() {
        let scene = new THREE.Scene();
        this.scenes.push(scene);

        scene.background = new THREE.Color(SCENE.BACKGROUND);
        scene.fog = new THREE.Fog( 0xa0a0a0, 100, 1000 );

        let light = new THREE.HemisphereLight( 0x555555, 0x222222 );
		light.position.set( 0, 2000, 0 );
        scene.add( light );
        this.hemisphereLight = light;

        
        let directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 90, 150, 90 );
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.top = 180;
        directionalLight.shadow.camera.bottom = - 100;
        directionalLight.shadow.camera.left = - 120;
        directionalLight.shadow.camera.right = 120;
        //scene.add( new THREE.CameraHelper( directionalLight.shadow.camera ) );
        scene.add( directionalLight );
        this.directionalLight = directionalLight;
        

        /*
         var spotLight = new THREE.SpotLight(0xffffff);
         spotLight.position.set(100, 100, 200);
         spotLight.intensity = 1;
         this.scene.add(spotLight);
         */

        /*
         var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
         directionalLight.position.set( 1, 1, 1 );
         this.scene.add( directionalLight );
         */

        return this.scenes.length-1;
    }

    addToScene(object) {
        this.scenes[this.currentScene].add(object);
    }

    getObjectByName(name) {
        return this.scenes[this.currentScene].getObjectByName(name);
    }

    createCamera() {
        //const CAM_X = -250, CAM_Y = 110, CAM_Z = 280;
        let camNear = new THREE.Vector3(SCENE.CAM_POS_NEAR_X, SCENE.CAM_POS_NEAR_Y, SCENE.CAM_POS_NEAR_Z);
        let camFar = new THREE.Vector3(SCENE.CAM_POS_FAR_X, SCENE.CAM_POS_FAR_Y, SCENE.CAM_POS_FAR_Z);
        const NEAR_PLANE = 0.1, FAR_PLANE = 10000;
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE );
        this.camera.position.copy(camNear);
        this.camPosNear = camNear;
        this.camPosFar = camFar;
    }

    moveCamera(rotation) {
        //Rotate camera about lookat point
        this.cameraRotation += rotation;
        let lookAt = this.controls.getLookAt();
        this.tempVector.copy(this.camera.position);
        this.tempVector.y = 0;
        let radius = this.tempVector.distanceTo(lookAt);
        let deltaX = radius*Math.sin(this.cameraRotation);
        let deltaZ = radius*Math.cos(this.cameraRotation);
        this.camera.position.set(lookAt.x + deltaX, this.camera.position.y, lookAt.z + deltaZ);
    }

    createControls() {
        this.controls = new TrackballControls(this.camera, this.container);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.0;
        this.controls.panSpeed = 1.0;

        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        // Disable controls
        const disableControls = true;
        this.controls.noRotate = disableControls;
	    this.controls.noZoom = disableControls;
        this.controls.noPan = disableControls;

        this.controls.keys = [ 65, 83, 68 ];

        const LOOK_X = 0, LOOK_Y = 15, LOOK_Z = 0;
        let lookAt = new THREE.Vector3(LOOK_X, LOOK_Y, LOOK_Z);
        this.controls.target.copy(lookAt);
    }

    setCamera(mode) {
        let camPos = mode === SCENE.NEAR ? this.camPosNear : this.camPosFar;
        this.camera.position.copy(camPos);
    }

    update() {
        //Do any updates
        this.controls.update();
        //this.stats.update();
    }

    run() {
        this.raycaster.setFromCamera( this.mouse, this.camera );
        this.currentViewGroup = this.weeklyView ? this.parentGroupWeekly : this.parentGroupDaily;
        this.hoverObjects = this.raycaster.intersectObjects(this.currentViewGroup.children);
        this.update();
        this.renderer.render( this.scenes[this.currentScene], this.camera );
        if(this.stats) this.stats.update();
        requestAnimationFrame(() => {
            this.run();
        });
    }

    initStats() {
        let stats = new Stats();

        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        $("#Stats-output").append( stats.domElement );

        return stats;
    }
}
