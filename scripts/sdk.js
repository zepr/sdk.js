var SUD = {};


SUD.init = function() {
    SUD.worker = null;

    // Sudoku generation
    var gen = document.getElementById('gen');
    gen.onsubmit = function(_e) {
        _e.preventDefault();
    }
    gen.onclick = function(_e) {
        _e.preventDefault();
        if (SUD.worker == null) {
            SUD.generate();
        }
    }

    // PDF generation
    var pdf = document.getElementById('pdf');
    pdf.onsubmit = function(_e) {
        _e.preventDefault();
    }
    pdf.onclick = function(_e) {
        _e.preventDefault();
        SUD.generatePDF(false);
    }

    var sol = document.getElementById('sol');
    sol.onsubmit = function(_e) {
        _e.preventDefault();
    }
    sol.onclick = function(_e) {
        _e.preventDefault();
        SUD.generatePDF(true);
    }


    // Manage logo
    SUD.animLogo();

    // Init images of numbers
    SUD.numbers = new Array(9);
    var canvas;
    for (var i = 0; i < 9; i++) {
        canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        ctx = canvas.getContext('2d');
        ctx.font = '52px Quicksand';
        ctx.fillStyle = 'black';
        ctx.fillText('' + (i + 1), Math.round((60 - ctx.measureText('' + (i + 1)).width) /2), 50);
        SUD.numbers[i] = canvas;
    }

    // Manage grid
    SUD.sudoku = document.getElementById('sudoku');
    SUD.sudoku.width = 580;
    SUD.sudoku.height = 580;

    SUD.animGrid();
}

// Start index, width
SUD.GRID_REF = [ 
    [0, 3], [0, 3], [180, 3], [180, 3], [360, 3], [360, 3], [540, 3], [540, 3],
    [60, 1], [120, 1], [240, 1], [300, 1], [420, 1], [480, 1]
];



/**
 * Draws an empty sudoku grid
 */
SUD.animGrid = function() {
    if (SUD.gridIndex) {
        // Animation
        var fx, fy; // from
        var tx, ty; // to

        var mainCtx = SUD.sudoku.getContext('2d');
        mainCtx.clearRect(0, 0, SUD.sudoku.width, SUD.sudoku.height);
        mainCtx.drawImage(SUD.backGrid, 0, 0);

        var ctx = SUD.backGrid.getContext('2d');
        ctx.strokeStyle = 'black';
        ctx.lineCap = 'round';
        //ctx.clearRect(0, 0, SUD.sudoku.width, SUD.sudoku.height);
        for (var i = 0; i < SUD.GRID_REF.length; i++) {
            if (SUD.gridIndex > SUD.GRID_REF[i][0]) {
                fx = 20;
                fy = 20 + SUD.GRID_REF[i][0];
                tx = 20 + Math.min(540, SUD.gridIndex - SUD.GRID_REF[i][0]);
                ty = fy;

                ctx.lineWidth = SUD.GRID_REF[i][1];
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(fy, fx);
                ctx.lineTo(ty, tx);
                ctx.stroke();
            }
        }

        SUD.gridIndex += 8;
    } else {
        // Init
        SUD.gridIndex = 8;

        SUD.backGrid = document.createElement('canvas');
        SUD.backGrid.width = 580;
        SUD.backGrid.height = 580;
    }

    if (SUD.gridIndex < 1100) { 
        requestAnimationFrame(SUD.animGrid);
    }
}


/** 
 * Sets full grid
 */
SUD.animShow = function() {

    var complete = (SUD.worker == null);

    if (SUD.gridNumbers) {
        // Animation
        var ctx = SUD.sudoku.getContext('2d');
        ctx.clearRect(0, 0, SUD.sudoku.width, SUD.sudoku.height);        

        var ctxNum;

        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                if (SUD.gridNumbers[i][j] > 0) {
               		var val = (SUD.gridNumbers[i][j] / 200) * Math.PI;
		            var zoom = 1 - (Math.cos(val + Math.PI / 2) + 1) * Math.sin(12 * val + Math.PI / 2);

        			ctx.save();
                    ctx.globalAlpha = Math.min(1, zoom);
                    ctx.translate(i * 60 + 50, j * 60 + 50);
                    ctx.scale(zoom, zoom);
                    ctx.drawImage(SUD.numbers[SUD.grid[i][j] - 1], -30, -30);
		        	ctx.restore();

                    if (SUD.gridNumbers[i][j] < 100) {
                        SUD.gridNumbers[i][j]++;
                        complete = false;
                    }
                }
            }
        }

        ctx.drawImage(SUD.backGrid, 0, 0);
    }

    if (complete) {
        SUD.gridNumbers = null;
    } else {
        requestAnimationFrame(SUD.animShow);
    }
}



/**
 * Manage logo background (Useless for sudoku generation)
 */
SUD.animLogo = function() {
    if (SUD.sprites) {
        // Animation
        var ctx = SUD.logo.getContext('2d');
        ctx.clearRect(0, 0, SUD.logo.width, SUD.logo.height);
        for (var i = 0; i < SUD.sprites.length; i++) {
			ctx.save();
            ctx.globalAlpha = SUD.sprites[i].a;
			ctx.translate(SUD.sprites[i].x, SUD.sprites[i].y);
            ctx.scale(SUD.sprites[i].s, SUD.sprites[i].s);
			ctx.rotate(SUD.sprites[i].r);
			ctx.drawImage(SUD.sprites[i].i, -25, -25);
			ctx.restore();

            SUD.sprites[i].r += SUD.sprites[i].dr;
            SUD.sprites[i].a += SUD.sprites[i].da;
            if (SUD.sprites[i].a > 0.7) {
                SUD.sprites[i].a = 0.7;
                SUD.sprites[i].da = -SUD.sprites[i].da;
            } else if (SUD.sprites[i].a < 0) {
                SUD.sprites[i].a = 0;
                SUD.sprites[i].da = -SUD.sprites[i].da;
            }

            SUD.sprites[i].y -= SUD.sprites[i].s * 0.6;
            if (SUD.sprites[i].y < -50) {
                SUD.sprites[i].y = 350;
                SUD.sprites[i].x = Math.random() * SUD.logo.width;
            }
        }

    } else {
        // Define and resize canvas
        SUD.logo = document.createElement('canvas');
        SUD.logo.id = 'logo';
        SUD.logo.width = window.innerWidth;
        SUD.logo.height = 300;

        // Insert in document
        var header = document.getElementsByTagName('header')[0];
        header.insertBefore(SUD.logo, header.firstChild);
        

       	window.addEventListener('resize', function() {
                SUD.logo.width = window.innerWidth;
                for (var i = 0; i < SUD.sprites.length; i++) {
                    SUD.sprites[i].x = Math.random() * SUD.logo.width;
                }
            }, false);
	    window.addEventListener('orientationchange', function() {
                SUD.logo.width = window.innerWidth;
                for (var i = 0; i < SUD.sprites.length; i++) {
                    SUD.sprites[i].x = Math.random() * SUD.logo.width;
                }
            }, false);

        // Init images
        var logoArray = new Array(9);

        var canvas;
        var ctx;
        var text;

        // Create images
        for (var i = 0; i < 9; i++) {
            canvas = document.createElement('canvas');
	        canvas.width = 50;
	        canvas.height = 50;
	        ctx = canvas.getContext('2d');
            ctx.font = '40px Quicksand';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.rect(2, 2, 46, 46);
            ctx.stroke();
            ctx.fillText('' + (i + 1), Math.round((50 - ctx.measureText('' + (i + 1)).width) /2), 40);
            logoArray[i] = canvas;
        }

        // Create Sprites
        SUD.sprites = new Array(81);
        for (var i = 0; i < SUD.sprites.length; i++) {
            SUD.sprites[i] = {
                i: logoArray[i % logoArray.length], // image
                x: Math.random() * SUD.logo.width, // x coord
                y: Math.random() * SUD.logo.height, // y coord
                r: Math.random(), // Rotation
                dr: (Math.random() - 0.5) / 100, // delta rotation
                s: Math.random() * 0.4 + 0.4, // scale and speed
                a: 0, // alpha
                da: (Math.random() - 0.5) * 0.01
            }
        }
    }


    requestAnimationFrame(SUD.animLogo);
}



SUD.callback = function(_msg) {

    switch (_msg.data.cmd) {
        case 'grid':
            SUD.solution = _msg.data.value;
            SUD.grid = new Array(9);
            for (var i = 0; i < 9; i++) {
                SUD.grid[i] = new Array(9);
                for (var j = 0; j < 9; j++) {
                    SUD.grid[i][j] = SUD.solution[i][j];
                }
            }

            // Init anim
            SUD.gridNumbers = new Array(9);
            for (var i = 0; i < 9; i++) {
                SUD.gridNumbers[i] = new Array(9);
                for (var j = 0; j < 9; j++) {
                    SUD.gridNumbers[i][j] = 0;
                }
            }

            SUD.animShow();
        break;
        case 'show':
            var pos = _msg.data.value;
            for (var i = 0; i < pos.length; i++) {
                SUD.gridNumbers[pos[i][0]][pos[i][1]] = 1;
            }
        break;
        case 'hide':
            var pos = _msg.data.value;
            for (var i = 0; i < pos.length; i++) {
                SUD.grid[pos[i][0]][pos[i][1]] = 0;
            }
        break;
        case 'complete':
            document.getElementById('ongen').innerHTML = 'Et voici le sudoku correspondant à la clé "' + SUD.key + '"';
            document.getElementById('key').value = '';

            SUD.worker = null;

            // Manage pdf
            if (typeof jsPDF !== 'undefined') {
                document.getElementById('formpdf').style.display = 'block';
            }
        break;
    }


}



SUD.generate = function() {

    if (SUD.worker == null) { // Init

        // Reset PDF section
        document.getElementById('formpdf').style.display = 'none';        

        // Check key
        var key = document.getElementById('key').value;
        if (key.length == 0) {
            for (var i = 0; i < 10; i++) {
                key += String.fromCharCode(97 + Math.floor(Math.random() * 26));
            }
            document.getElementById('key').value = key;
        }

        SUD.key = key;

        // Change text
        document.getElementById('ongen').innerHTML = 'Génération en cours...';

        // Launch worker
        SUD.worker = new Worker('scripts/worker.js');
        SUD.worker.onmessage = SUD.callback;
        SUD.worker.postMessage(key);
    }
}


/**
 * Genere un export pdf avec la bibliotheque jsPDF
 */
SUD.generatePDF = function(_solution) {

    var pdf = new jsPDF('portrait', 'mm', 'A4');
    pdf.setLineCap(1);

    // Logo
    pdf.setDrawColor(255, 0, 102);
    pdf.setLineWidth(1);
    pdf.rect(55, 25, 100, 50);

    pdf.setFont("Helvetica");
    pdf.setTextColor(255, 0, 102);
    pdf.setFontSize(36);
    pdf.text(86, 52, 'SDK.js');

    pdf.setFontSize(14);
    pdf.text(114, 74, 'https://zepr.fr/sdk/');

    // Key
    pdf.setTextColor(255, 0, 102);
    pdf.setFontSize(20);
    pdf.text(37.5, 100, 'Clé :');
    pdf.setTextColor(0, 0, 0);
    pdf.text(65, 100, SUD.key);


    // Grid
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    for (var i = 0; i < 4; i++) {
        pdf.line(37.5 + i * 45, 124.5, 37.5 + i * 45, 259.5);    
        pdf.line(37.5, 124.5 + i * 45, 172.5, 124.5 + i * 45);
    }

    pdf.setLineWidth(0.4);
    for (var i = 0; i < 3; i++) {
        pdf.line(52.5 + i * 45, 124.5, 52.5 + i * 45, 259.5);    
        pdf.line(67.5 + i * 45, 124.5, 67.5 + i * 45, 259.5); 
        pdf.line(37.5, 139.5 + i * 45, 172.5, 139.5 + i * 45);
        pdf.line(37.5, 154.5 + i * 45, 172.5, 154.5 + i * 45);
    }

    // Numbers
    pdf.setFontSize(32);
    
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (SUD.grid[i][j] > 0) {
                pdf.setTextColor(0, 0, 0);
                pdf.text(42 + i * 15, 136 + j * 15, '' + SUD.grid[i][j]);
            } else if (_solution) {
                pdf.setTextColor(255, 0, 102);
                pdf.text(42 + i * 15, 136 + j * 15, '' + SUD.solution[i][j]);
            }
        }
    }

    if (_solution) {
        pdf.save('Solution_' + SUD.key + '.pdf');
    } else {
        pdf.save('Sudoku_' + SUD.key + '.pdf');
    }
}



window.addEventListener('load', SUD.init, false);
