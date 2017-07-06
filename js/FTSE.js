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

        //DEBUG
        let geom = new THREE.BoxGeometry(3, 3, 3);
        let mat = new THREE.MeshLambertMaterial({color: 0xff0000});
        let box = new THREE.Mesh(geom, mat);

        this.addToScene(box);
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
