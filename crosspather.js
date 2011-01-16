include('http://i-nathan.com/js/jquery.js');
include('http://i-nathan.com/js/jquery.xpath.js');

var xpath1;
var xpath2;
var highlightedElement;
var oldBackgroundColor;
var clickCount = 0;		
installCrossPather();

/**
 * Setup event handlers and display welcome
 */
function installCrossPather() {
	alert('Welcome to CrossPather. Click two elements after clicking OK.');

	document.onclick = click;
	document.onmouseover = mouseOnIt;
	document.onmouseout = mouseOffIt;
	return;	
}

/**
 * Remove event handlers.
 */ 
function uninstallCrossPather(){
	document.onclick = null;
	document.onmouseover = null;
	document.onmouseout = null;
}

/**
 * The event that happens when the mouse moves on top of a node
 */
function mouseOnIt(e) {
	var target = e.target;
	oldBackgroundColor = jQuery(target).
		css("background-color");
	
	jQuery(target).
		css("background-color", "yellow");
	highlightedElement = target;	
}

/**
 * The event that happens when the mouse moves off a node
 */
function mouseOffIt(e) {
	jQuery(highlightedElement).css("background-color", oldBackgroundColor);
}

/**
 * The event that happens on a mouse click.
 * Click 1: Finds the XPath of the first element
 * Click 2: Finds the XPaths of the second element and finds the merged and simplified XPaths
 */
function click(e) {

	// prevent following links if they're clicked
	if (!e) {
		var e = window.event;
	}
    if (e.target) {
		var target = e.target;
	}
    else if (e.srcElement) {
		var target = e.srcElement;
	}
	e.returnValue = false;
	if (e.stopPropagation) {
		e.stopPropagation();
		e.preventDefault();
	}
	
	if (clickCount < 1) {
		xpath1 = getXPath(target);
	}
	else {
		xpath2 = getXPath(target);

		var mergedXPaths = mergeXPaths(xpath1, xpath2);
		var simpleXPath = simplifyMergedXPath(mergedXPaths);

		alert('XPath 1:    ' + xpath1 + '\n\n' +
			  'XPath 2:    ' + xpath2 + '\n\n' + 
			  'Merged:     ' + mergedXPaths + '\n\n' +
			  'Simplified: ' + simpleXPath + '\n');

		uninstallCrossPather();
	}
	clickCount++;
}

/**
 * Finds an XPath given an element by traversing up its parent nodes,
 * taking note of common attributes and sibling-relative indexes.
 * 
 * With portions from http://snippets.dzone.com/posts/show/4349
 */
function getXPath(element) {
	var path = "";
	var previousElement;
    for (; element && element.nodeType == 1; element = element.parentNode) {
      	
		var relativeCount = 0;
		var xname;
		
		// We do not currently deal with namespaces. We just remove them and make a relative reference instead.
		// Iteration needed here in case there are multiple namespace elements in a row, we don't want to insert multiple '//'s
		do {
			xname = element.tagName.toLowerCase();
			previousElement = element;
			element = element.parentNode;
			relativeCount++;
		} while (xname.indexOf(':') != -1);
		
		// back up one element so that the for loop doesn't iterate an extra time because of our do-while iteration.
		element = previousElement;
		
		// Insert an additional '/' for a relative reference if we hit a tag with a namespace in it.
		if (relativeCount > 1) {
			path = '/' + path;
			continue;
		}
		
		//TODO may need to remove tbody's if firefox inserts them and other places don't
		
		index = getElementIndex(element);
     	if (index > 1) {
			xname += '[' + index + ']';
		}
		
		//add common distinguishing attributes
		//CAUTION: this must be done after inserting an index because
		//if this came first, the index would apply only to matched attributes
		var attrs = new Array('class', 'id', 'name', 'type');
		for (var i in attrs) {
			if (element.hasAttribute(attrs[i])) {
				xname += "[@" + attrs[i] + "='" + element.getAttribute(attrs[i])+"']";
			}
		}
		
    	path = '/' + xname + path;
		previousElement = element;
    }
    
    return path;	
}

/**
 * Finds the index of an element relative to its siblings.
 */
function getElementIndex(element) {
    var count = 1;
    for (var sib = element.previousSibling; sib ; sib = sib.previousSibling) {
        if(sib.nodeType == 1 && sib.tagName == element.tagName) {
			count++
		}
    }
    return count;
}

/**
 * Merges the two input XPaths to create an XPath referencing
 * a node set including both input XPaths. For two XPaths in the
 * same table or list, this will result in the XPath for all elements in the
 * table or list. For more disparate elements, results may be unpredictable.
 * 
 * TODO: rewrite this using lcs.js (longest common subsequence) because this 
 * assumes the two sequences are very similar until the end.
 */
function mergeXPaths(xpath1, xpath2) {
	var tags1 = xpath1.split('/');
	var tags2 = xpath2.split('/');
	var mergedXPaths = [];
	var lastLength = -1; // will be used to know if we skipped a tag and need to insert a relative xpath component
	
	for (var i = 0; i < tags1.length && i < tags2.length; i++) {

		// If it's the same length, we didn't add anything last time
		// and we need to insert another '/' to make further additions relative.
		if (lastLength == mergedXPaths.length) {
			mergedXPaths.push('/');
		}
		lastLength = mergedXPaths.length;
		
		if (tags1[i] == tags2[i] &&
			tags1[i] != "") {
			mergedXPaths.push('/' + tags1[i]);
		}
		else {
			mergeConditionalTags(tags1[i], tags2[i], mergedXPaths);
		}
	}
	
	return mergedXPaths.join("");
}

/**
 * Merges two tags with conditional elements, keeping only
 * elements that appear in both. This has the effect of 
 * broadening the scope of the XPath.
 * 
 * Ex) /table/tr[1] + /table/tr[3] = /table/tr
 */
function mergeConditionalTags(tag1, tag2, buffer) {
	var conds1 = tag1.split(/[\[\]]/); // the first of these will be the tag
	var conds2 = tag2.split(/[\[\]]/); // followed by conditions with possible
									   // empty strings if there are multiple conditions

	if (conds1.length > 1 || conds2.length > 1) { 	 // we shouldn't be here in the first place if this is false
		
		for (var j = 0; j < conds1.length && j < conds2.length; j++) {
			
			if (conds1[j] == conds2[j] &&
				conds1[j] != "") {
				
				if (j == 0) {
					buffer.push('/' + conds1[j]); // the tag
				}
				else {
					buffer.push('[' + conds1[j] + ']'); // a conditional element
				}
			}
		}
	}
}

/**
 * Simplifies a merged XPath by iteratively substituting  higher level 
 * nodes for a relative reference as long as they generate the same 
 * number of hits.
 */
function simplifyMergedXPath(xpath) {
	var origXPath = xpath;
	var origResultCount = getResultCount(xpath);
	var previousXPath;
	
	do {
		previousXPath = xpath;
		xpath = deleteTopLevel(xpath);
	} while (origResultCount == getResultCount(xpath) &&
			 xpath != null);
		
	return previousXPath;		
}

/**
 * Finds the number of matches for an XPath within a document.
 */
function getResultCount(xpath) {
	var resultCount;
	try {
		var xpathResult = document.evaluate('count(' + xpath + ')', document, null, XPathResult.ANY_TYPE, null);
		resultCount = xpathResult.numberValue;
	}
	catch (err) {
		resultCount = 0;
	}
	return resultCount;
}

/**
 * Removes the highest level tag and replaces it with a relative reference
 * and returns null if you give it an XPath with only one tag.
 */
function deleteTopLevel(xpath) {
	var shorterXPath = null;
	var afterFirstTag = xpath.indexOf('/', 2); // start with second index to avoid leading '/' or '//'
	
	if (afterFirstTag >= 0) {
	
		// deal with there being another relative reference in the xpath already
		var relativeAfterFirstTag = xpath.indexOf('//', 2);
		if (relativeAfterFirstTag == afterFirstTag) {
			afterFirstTag = relativeAfterFirstTag + 1;
		}
	
		shorterXPath = '//' + xpath.substr(afterFirstTag + 1);
	}
	
	return shorterXPath;
}

/**
 * Include other js files
 */
function include(jsUrl)
{
      var s = document.createElement('script');
      s.setAttribute('src', jsUrl);
      document.getElementsByTagName('head')[0].appendChild(s);
}
