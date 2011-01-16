/**
 * When creating original xpaths, create and use an XPathTag object to:
 * 	- Track the position of a tag (will be used later to know when relative references are needed).
 *	- Associate required conditional attributes with each tag.
 *	- Create an equals method that ensures conditional attributes are not included in main LCS finding.
 * Use longest common subsequence on tags to find needed tags and insert relative references where neccissary.
 * For each remaining tag pair (must keep a reference to the correspondign tag in X and Y), find the LCS of the attributes
 * Convert the LCS to a string adding relative //'s when position of the tag skips.
 */

/**
 * Find a longest common subsenquence.
 *
 * Note: this is  neccissarily the only possible longest common subsequence though!
 */
function lcs(listX, listY) {
	return lcsBackTrack(
				lcsLengths(listX, listY),
				listX, listY, 
				listX.length, listY.length);
}

/**
 * Iteratively memoize a matrix of longest common subsequence lengths.
 */
function lcsLengths(listX, listY) {
	var lenX = listX.length;
	var lenY = listY.length;
	
	// Initialize a lenX+1 x lenY+1 matrix
	var memo = [lenX+1];
	for (var i = 0; i < lenX+1; i++) {
		memo[i] = [lenY+1];
		for (var j = 0; j < lenY+1; j++) {
			memo[i][j] = 0;
		}
	}
		
	// Memoize the lcs length at each position in the matrix
	for (var i = 1; i < lenX+1; i++) {
		for (var j = 1; j < lenY+1; j++) {
			if (listX[i-1] == listY[j-1]) {
				memo[i][j] = memo[i-1][j-1] + 1;
			}
			else {
				memo[i][j] = Math.max(
					memo[i][j-1],
					memo[i-1][j]);
			}
		}
	}
	
	return memo;
}

/**
 * Recursively read back a memoized matrix of longest common subsequence lengths
 * to find a longest common subsequence.
 */
function lcsBackTrack(memo, listX, listY, posX, posY) {
	
	// base case
	if (posX == 0 || posY == 0) {
		return "";
	}
	
	// matcth => go up and left
	else if (listX [posX-1] == listY[posY-1]) {
		return lcsBackTrack(memo, listX, listY, posX-1, posY-1) + listX[posX-1];
	}
	
	else {
		// go up
		if (memo[posX][posY-1] > memo[posX-1][posY]) { 
			return lcsBackTrack(memo, listX, listY, posX, posY-1);
		}
		
		// go left
		else {
			return lcsBackTrack(memo, listX, listY, posX-1, posY);
		}
	}
}

/*
//var lcsStr = lcs(["ab","cd","ef"], ["aa", "ab", "ef", "bb"]);
var lcsStr = lcs("antler", "lantern");
alert(lcsStr);
*/