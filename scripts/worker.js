var SUD = {};



onmessage = function(_msg) {

    var rand = new SUD.Rand(_msg.data);

    // Generate complete grid
    var grid = SUD.generate(rand);
    postMessage({
        cmd: 'grid',
        value: grid
    });

    // Remove cells
    var check = new Array(9);
    for (var i = 0; i < 9; i++) {
        check[i] = new Array(9);
        for (var j = 0; j < 9; j++) {
            check[i][j] = false;
        }
    }

    var control = 0;
    var x;
    var y;
    var clone;
    while (control < 60) {
        do {
            x = rand.nextInt(9);
            y = rand.nextInt(9);
        } while (check[x][y]);

        check[x][y] = true;
        check[8 - x][8 - y] = true;
        control += 2;
        if (x == 4 && y == 4) { // Central cell
            control--; 
        }

        clone = SUD.clone(grid);
        clone[x][y] = 0;
        clone[8 - x][8 - y] = 0;

        if (SUD.canSolve(clone)) {
            grid = clone;
            postMessage({
                cmd: 'hide',
                value: [[x, y], [8 - x,8 - y]]
            });          
        } else {
            postMessage({
                cmd: 'show',
                value: [[x, y], [8 - x,8 - y]]
            });
        }
    }

    // Conmplete grid checks
    for (y = 0; y < 9; y++) {
        for (x = 0; x < 9; x++) {
            if (!check[x][y]) {
                check[x][y] = true;
                check[8 - x][8 - y] = true;
                control += 2;
                if (x == 4 && y == 4) { // Central cell
                    control--; 
                }

                clone = SUD.clone(grid);
                clone[x][y] = 0;
                clone[8 - x][8 - y] = 0;

                if (SUD.canSolve(clone)) {
                    grid = clone;
                    postMessage({
                        cmd: 'hide',
                        value: [[x, y], [8 - x, 8 - y]]
                    });          
                } else {
                    postMessage({
                        cmd: 'show',
                        value: [[x, y], [8 - x, 8 - y]]
                    });
                }
            }
        }
    }

    postMessage({
        cmd: 'complete'
    });
}

/**
 * Generate a complete grid (https://en.wikipedia.org/wiki/Las_Vegas_algorithm)
 * A generation may require a few thousands attempts
 * There shoud be no console.log in this code
 */
SUD.generate = function(_rand) {
    var grid = null;
    do {
        grid = SUD.generateSub(_rand);
    } while (grid == null);

    return grid;
}

/**
 * Generation attempt (https://en.wikipedia.org/wiki/Monte_Carlo_algorithm)
 */
SUD.generateSub = function(_rand) {   
    var solver = new SUD.Solver(null);

    var x;
    var y;
    var attempts;

    for (var b = 0; b < 9; b++) { // For each block
        for (var j = 0; j < 3; j++) {
            for (var i = 0; i < 3; i++) {
                x = SUD.BLOCKS[b][0] + i;
                y = SUD.BLOCKS[b][1] + j;
                attempts = 0;
                do {
                    value = _rand.nextInt2(9);
                    if (attempts > 20) return null;
                    attempts++;
                } while (!SUD.Bits.has(solver.local[x][y], value));
                solver.set(x, y, value);
            }
        }
    }

    return solver.grid;
}

/**
 * Colne a 9x9 array (any type)
 */
SUD.clone = function(_grid) {
    var grid = new Array(9);
    for (var i = 0; i < 9; i++) {
        grid[i] = new Array(9);
        for (var j = 0; j < 9; j++) {
            grid[i][j] = _grid[i][j];
        }
    }

    return grid;
}


/**
 * Check if solver can solve a particular grid
 */
SUD.canSolve = function(_grid) {
    var solver = new SUD.Solver(_grid);

    do {
        update = false;
        solver.checkOneLineInBlock();
        solver.checkInterlockInBlock();
        update |= solver.checkLastPositionInBlock();
        update |= solver.checkLastPositionInLine();
        update |= solver.checkLastPossibleValue();
    } while (update);

    // Check if the grid is complete
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (solver.grid[i][j] == 0) {
                return false;
            }
        }
    }    

    return true;    
}




SUD.Rand = function(_seed) {
    this.seed = _seed;
    if (typeof this.seed === 'string') {
        this.seed = this.hash(this.seed);
    }
}

/**
 * Get hashcode of string
 * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
SUD.Rand.prototype.hash = function(_str) {
    var hash = 0;
    if (_str == null || _str.length == 0) return hash;
    for (i = 0; i < _str.length; i++) {
        char = _str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

/**
 * Returns a value between 0 and 1 (exclusive)
 * This RNG is NOT uniformly distributed
 * TODO: improve!!!
 */
SUD.Rand.prototype.next = function() {
    var val = Math.sin(this.seed++) * 12345;
    return val - Math.floor(val);
}


/**
 * Returns a number between 0 and _max (exclusive)
 */
SUD.Rand.prototype.nextInt = function(_max) {
    value = Math.floor(this.next() * _max * 123);
    return value % _max;
}


/**
 * Returns a number between 1 and _max (inclusive)
 */
SUD.Rand.prototype.nextInt2 = function(_max) {
    return 1 + this.nextInt(_max);
}



SUD.BLOCK_INDEX = [0, 0, 0, 3, 3, 3, 6, 6, 6];
SUD.BLOCKS = [[0, 0], [3, 0], [6, 0], [0, 3], [3, 3], [6, 3], [0, 6], [3, 6], [6, 6]];
SUD.BLOCK_CONTENT = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]];

SUD.Solver = function(_grid) {
    // Store possible values (Initialised to ALL [9bits set])
    this.local = new Array(9);
    for (var i = 0; i < 9; i++) {
        this.local[i] = new Array(9);
        for (var j = 0; j < 9; j++) {
            this.local[i][j] = 0x1FF; // 9bits
        }
    }

    // Already solved (By block, initialised to EMPTY [0])
    this.blockSolved = new Array(9);
    for (var i = 0; i < 9; i++) {
        this.blockSolved[i] = 0;
    }

    // Store solved grid (Initialised to EMPTY [0])
    this.grid = new Array(9);
    for (var i = 0; i < 9; i++) {
        this.grid[i] = new Array(9);
        for (var j = 0; j < 9; j++) {
            this.grid[i][j] = 0;
        }
    }

    // Set initial values
    if (_grid) {
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                if (_grid[i][j] > 0) {
                    this.set(i, j, _grid[i][j]);
                }
            }
        }
    }
}

/**
 * Fix value for one of the cell, update solver data accordingly
 */
SUD.Solver.prototype.set = function(_x, _y, _val) {
    this.grid[_x][_y] = _val;
    // Remove value from line/row
    for (var i = 0; i < 9; i++) {
        this.local[_x][i] = SUD.Bits.remove(this.local[_x][i], _val);
        this.local[i][_y] = SUD.Bits.remove(this.local[i][_y], _val);
    }
    // Remove from block
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            this.local[SUD.BLOCK_INDEX[_x] + i][SUD.BLOCK_INDEX[_y] + j] 
            = SUD.Bits.remove(this.local[SUD.BLOCK_INDEX[_x] + i][SUD.BLOCK_INDEX[_y] + j], _val);
        }
    }
    // Add solved to block
    var idxBlock = (SUD.BLOCK_INDEX[_x] / 3) + SUD.BLOCK_INDEX[_y];
    this.blockSolved[idxBlock] |= (1 << (_val - 1));
    //console.log(idxBlock + ' [' + _x + '][' + _y+ '] > ' + this.blockSolved[idxBlock]);

    // Empty possible values
    this.local[_x][_y] = 0;//(1 << (_val -1));
}

/**
 * Check if there is just one position possible for a value in a block
 */
SUD.Solver.prototype.checkLastPositionInBlock = function() {
    
    var update = false;
    var last = new Array(2);
    var count = 0;

    for (var v = 1; v <= 9; v++) { // Value checked
        for (var b = 0; b < 9; b++) { // Block index
            if (!SUD.Bits.has(this.blockSolved[b], v)) { // Only if value not yet found
                count = 0;
                for (var i = 0; i < 3; i++) {
                    for (var j = 0; j < 3; j++) {
                        if (SUD.Bits.has(this.local[i + SUD.BLOCKS[b][0]][j + SUD.BLOCKS[b][1]], v)) {
                            count++;
                            if (count == 1) {
                                last[0] = i + SUD.BLOCKS[b][0];
                                last[1] = j + SUD.BLOCKS[b][1];
                            }
                        }
                    }
                }
                if (count == 1) {
                    //console.log('Found1!!! [' + b + ']> ' + v + ' [' + last[0] + ', ' + last[1] + ']');
                    this.set(last[0], last[1], v);
                    update = true;
                }
            }
        }
    }

    return update;
}



/**
 * Check if there is just one position possible for a value in a row or line
 */
SUD.Solver.prototype.checkLastPositionInLine = function() {
    
    var update = false;
    var countLine = 0;
    var countRow = 0;
    var lastLine = -1;
    var lastRow = 0;

    for (var v = 1; v <= 9; v++) { // Value checked
        for (var i = 0; i < 9; i++) { // Row/line to check
            lastRow = 0;
            lastLine = 0;
            for (var j = 0; j < 9; j++) { // Items in the row/line
                if (SUD.Bits.has(this.local[i][j], v)) {
                    lastRow = j;
                    countRow++;
                }
                if (SUD.Bits.has(this.local[j][i], v)) {
                    lastLine = j;
                    countLine++;
                }
            }

            if (countRow == 1) {
                //console.log('Found2!!! ' + v + ' [' + i + ', ' + lastRow + ']');
                this.set(i, lastRow, v);
                update = true;
            }

            if (countLine == 1 
                && this.local[lastLine][i] > 0) { // Avoid double update (row + line)
                //console.log('Found3!!! ' + v + ' [' + lastLine + ', ' + i + ']');
                this.set(lastLine, i, v);
                update = true;                
            }
        }
    }

    return update;
}




/**
 * Check if there is just one value possible for a cell
 */
SUD.Solver.prototype.checkLastPossibleValue = function() {
    
    var update = false;
    
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (SUD.Bits.isLast(this.local[i][j])) {
                var value = SUD.Bits.indexOf(this.local[i][j]);
                //console.log('Found4!!! ' + value + ' [' + i + ', ' + j + ']');
                this.set(i, j, value);
                update = true;
            }
        }
    }

    return update;
}


/**
 * Check if a value is only possible in a row/line of a block (invalidate possibilities in other blocks)
 */
SUD.Solver.prototype.checkOneLineInBlock = function() {

    var update = false;

    var line;
    var row;

    for (var v = 1; v <= 9; v++) { // Value checked
        for (var b = 0; b < 9; b++) { // Block index
            if (!SUD.Bits.has(this.blockSolved[b], v)) { // Only if value not yet found
                line = 0;
                row = 0;

                for (var i = 0; i < 3; i++) {
                    for (var j = 0; j < 3; j++) {
                        // Row
                        if (SUD.Bits.has(this.local[i + SUD.BLOCKS[b][0]][j + SUD.BLOCKS[b][1]], v)) {
                            row = SUD.Bits.add(row, i + 1);
                        }
                        // Line
                        if (SUD.Bits.has(this.local[j + SUD.BLOCKS[b][0]][i + SUD.BLOCKS[b][1]], v)) {
                            line = SUD.Bits.add(line, i + 1);
                        }
                    }                   
                }

                if (SUD.Bits.isLast(row)) {
                    // Eliminate in other blocks
                    var realRow = SUD.Bits.indexOf(row) + SUD.BLOCKS[b][0] - 1;
                    //console.log('Block ' + b + ' -> ' + realRow);
                    for (var k = 0; k < 9; k++) {
                        if (SUD.BLOCK_INDEX[k] != SUD.BLOCKS[b][1]) { // Not in block detected
                            //console.log('Elimine ' + k);
                            if (SUD.Bits.has(this.local[realRow][k]), v) {
                                //console.log('Update1 ['+v+'] b' + b);
                                update = true;
                                this.local[realRow][k] = SUD.Bits.remove(this.local[realRow][k], v);
                            }
                        }
                    }
                }

                if (SUD.Bits.isLast(line)) {
                    // Eliminate in other blocks
                    var realLine = SUD.Bits.indexOf(line) + SUD.BLOCKS[b][1] - 1;
                    //console.log('Block ' + b + ' -> ' + realLine);
                    for (var k = 0; k < 9; k++) {
                        if (SUD.BLOCK_INDEX[k] != SUD.BLOCKS[b][0]) { // Not in block detected
                            //console.log('Elimine ' + k);
                            if (SUD.Bits.has(this.local[k][realLine]), v) {
                                //console.log('Update2 ['+v+'] b' + b);
                                update = true;
                                this.local[k][realLine] = SUD.Bits.remove(this.local[k][realLine], v);
                            }
                        }
                    }
                }
                
            }
        }
    }

    return update;
}

/**
 * Check if 2 distincts values are only possible on the same 2 spots (Eliminate other values)
 */
SUD.Solver.prototype.checkInterlockInBlock = function() {

    var count = new Array(10);
    var pos = new Array(10);
    var idx;

    var update = false;

    for (var b = 0; b < 9; b++) { // Block index
        // Reset data
        for (var reset = 1; reset <= 9; reset++) {
            count[reset] = 0;
            pos[reset] = 0;
        }
        
        // Check posible values pos
        for (var v = 1; v <= 9; v++) { // Value checked
            idx = 0;
            if (!SUD.Bits.has(this.blockSolved[b], v)) { // Only if value not yet found
                for (var j = 0; j < 3; j++) {
                    for (var i = 0; i < 3; i++) {
                        idx++;
                        if (SUD.Bits.has(this.local[i + SUD.BLOCKS[b][0]][j + SUD.BLOCKS[b][1]], v)) {
                            count[v]++;
                            pos[v] = SUD.Bits.add(pos[v], idx);
                        }
                    }
                }
            }
        }

        // Analyse
        // Search for values with 2 possible positions
        // Then search for values whose positions are equal
        for (var an = 1; an < 9; an++) {
            if (count[an] == 2) {
                for (var an2 = an + 1; an2 <= 9; an2++) {
                    if (pos[an] == pos[an2]) { // No need to check count[an2]
                        // Clean possible values (Just let the 2 matching values)
                        var newLocal = SUD.Bits.add(SUD.Bits.add(0, an), an2);

                        for (idx = 1; idx <= 9; idx++) {
                            if (SUD.Bits.has(pos[an], idx)) {
                                this.local
                                    [SUD.BLOCK_CONTENT[idx - 1][0] + SUD.BLOCKS[b][0]]
                                    [SUD.BLOCK_CONTENT[idx - 1][1] + SUD.BLOCKS[b][1]] = newLocal;
                            }
                        }
                        update = true;
                    }
                }
            }
        }
    }

    return update;
}



SUD.print = function(_grid) {
    var line;
    for (var j = 0; j < 9; j++) {
        line = '';
        for (var i = 0; i < 9; i++) {
            if (i > 0 && i % 3 == 0) {
                line += '|';
            }
            line += _grid[i][j];
        }
        
        if (j > 0 && j % 3 == 0) {
            console.log('---+---+---');
        }
        console.log(line);
    }
}




/**
 * Bit manipulation functions
 */
SUD.Bits = {};

/**
 * Count number of bits set in integer
 */
SUD.Bits.count = function(_val) {
    // Hamming weight
    _val = _val - ((_val >> 1) & 0x55555555);
    _val = (_val & 0x33333333) + ((_val >> 2) & 0x33333333);
    return ((_val + (_val >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
}

/**
 * True if only one bit is set
 */
SUD.Bits.isLast = function(_val) {
    if (_val == 0) return false;
    return (_val & (_val - 1)) == 0;
}

/**
 * True it bit is set to 1
 * From 1 [right most] to 9 [left most]
 */
SUD.Bits.has = function(_val, _idx) {
    return ((_val & (1 << (_idx - 1))) > 0);
}


/**
 * Return index of most significant bit set in 9bits integer
 * From 1 [right most] to 9 [left most], -1 if not found
 */
SUD.Bits.indexOf = function(_val) {
    for (var i = 1; i <= 9; i++) {
        if (_val & 1 > 0) return i;
        _val >>= 1;
    }
    return -1;
}

/**
 * Remove bit from 9bits integer
 * From 1 [right most] to 9 [left most]
 * No effect if already removed
 */
SUD.Bits.remove = function(_val, _idx) {
    var mask = 0x1FF - (1 << (_idx - 1));
    return _val & mask;
}

/**
 * Add bit from 9bits integer
 * From 1 [right most] to 9 [left most]
 * No effect if already added
 */
SUD.Bits.add = function(_val, _idx) {
    var mask = 1 << (_idx - 1);
    return _val | mask;
}

