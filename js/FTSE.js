/**
 * Created by DrTone on 06/07/2017.
 */



class FTSEApp extends BaseApp {
    constructor() {
        super();

    }

    createScene() {
        //Init base createsScene
        super.createScene();

        //Set up main scene
        const CENTRE_HEIGHT = 60;
        const CENTRE_RADIUS = 5;
        const SEGMENTS = 16;
        const WALL_HEIGHT = 60;
        const WALL_DEPTH = 120;
        const WALL_WIDTH = 5;
        const NUM_WALLS = 5;
        let ROT_INC = (Math.PI * 2)/NUM_WALLS;

        //Main spindle
        let geom = new THREE.CylinderBufferGeometry(CENTRE_RADIUS, CENTRE_RADIUS, CENTRE_HEIGHT, SEGMENTS);
        let mat = new THREE.MeshLambertMaterial({color: 0xFFFB37});
        let spindle = new THREE.Mesh(geom, mat);
        this.addToScene(spindle);

        //Walls
        let i, wall, walls = [];
        geom = new THREE.BoxBufferGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, SEGMENTS, SEGMENTS);
        for(i=0; i<NUM_WALLS; ++i) {
            wall = new THREE.Mesh(geom, mat);
            wall.rotation.y = ROT_INC*(i + 1);
            walls.push(wall);
            this.addToScene(walls[i]);
        }
    }

    update() {
        super.update();
        let delta = this.clock.getDelta();
        this.elapsedTime += delta;

    }
}

$(document).ready( () => {
    let container = document.getElementById("WebGL-output");
    let app = new FTSEApp();
    app.init(container);
    //app.createGUI();
    app.createScene();


    app.run();

});
