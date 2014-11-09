/* This file is licensed under the Affero General Public License. */

var set = {};
var string = {};


set.equal = function(a, b) {
	return a === b || (a && b && ((a.__id__ && a.__id__ === b.__id__) || (a.text && a.text === b.text)));
};


set.diff = function(a, b) {
	var i = 0, j = 0, patches = [];
	while(i <= a.length || j <= b.length) {
		if(set.equal(a[i], b[j])) {
			i++;
			j++;
			continue;
		}
		
		// Detect insert
		var k;
		for(k = j + 1; k <= b.length; k++) {
			if(set.equal(a[i], b[k])) {
				patches.push([i, 0].concat(b.slice(j, k)));
				i++;
				j = k + 1;
				break;
			}
		}
		if(k !== b.length + 1) continue;
		
		// Detect remove
		for(k = i + 1; k <= a.length; k++) {
			if(set.equal(a[k], b[j])) {
				patches.push([i, k - i]);
				j++;
				i = k + 1;
				break;
			}
		}
		if(k !== a.length + 1) continue;
		
		// Replace one
		patches.push([i, 1].concat([b[j]]));
		i++;
		j++;
	}
	return patches.reverse();
};

set.merge = function(first, second, resolve) {
	second.forEach(function(item) {
		item.fromSecond = true;
	});
	var result = first.concat(second);
	result.sort(function(a, b) {
		return b[0] - a[0];
	});
	function patches_equal(a, b) {
		return a.length === b.length && a[0] === b[0] && a[1] === b[1] && a.slice(2).every(function(item, i) {
			return set.equal(item, b[i + 2]);
		});
	}
	function patches_overlap(a, b) {
		return a.fromSecond !== b.fromSecond && b[0] <= a[0] + a[1]; // Less strict would be <
	}
	for(var i = 1; i < result.length; i++) {
		if(patches_equal(result[i], result[i - 1])) {
			result.splice(i, 1);
		} else if(patches_overlap(result[i], result[i - 1])) {
			console.log('merge conflict:', result[i - 1], result[i]);
			result.splice.apply(result, [i - 1, 2].concat(resolve(result[i - 1], result[i])));
		}
	}
	return result;
};

set.patch = function(parent, patches) {
	parent = parent.slice();
	for(var i = 0; i < patches.length; i++) {
		parent.splice.apply(parent, patches[i]);
	}
	return parent;
};

set.merge3 = function(parent, first, second, resolve) {
	return set.patch(parent, set.merge(set.diff(parent, first), set.diff(parent, second), resolve));
};


string.merge3 = function(parent, first, second, resolve) {
	// Source: https://en.wikipedia.org/wiki/Levenshtein_distance
	function levenshteinDistance(s, t) {
		// degenerate cases
		if(s === t) return 0;
		if(s.length === 0) return t.length;
		if(t.length === 0) return s.length;
		
		// create two work vectors of integer distances
		var v0 = new Array(t.length + 1);
		var v1 = new Array(t.length + 1);
		
		// initialize v0 (the previous row of distances)
		// this row is A[0][i]: edit distance for an empty s
		// the distance is just the number of characters to delete from t
		var i, j;
		for(i = 0; i < v0.length; i++) {
			v0[i] = i;
		}
		
		for(i = 0; i < s.length; i++) {
			// calculate v1 (current row distances) from the previous row v0
			
			// first element of v1 is A[i+1][0]
			//   edit distance is delete (i+1) chars from s to match empty t
			v1[0] = i + 1;
			
			// use formula to fill in the rest of the row
			for(j = 0; j < t.length; j++) {
				var cost = (s[i] === t[j]) ? 0 : 1;
				v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
			}
			
			// copy v1 (current row) to v0 (previous row) for next iteration
			for(j = 0; j < v0.length; j++) {
				v0[j] = v1[j];
			}
		}
		
		return v1[t.length];
	}
	
	function split(str, by, equal, similar, comparedTo) {
		var ctr = comparedTo.length;
		var prev;
		var taken = {};
		return str.split(by).map(function(line) {
			var obj = {
				text: line
			};
			var id;
			var _prev = prev;
			prev = null;
			if(comparedTo[_prev + 1] && !taken[comparedTo[_prev + 1].__id__] && (equal(obj.text, comparedTo[_prev + 1].text) || similar(obj.text, comparedTo[_prev + 1].text))) {
				id = comparedTo[_prev + 1].__id__;
				taken[comparedTo[_prev + 1].__id__] = true;
				prev = _prev + 1;
			} else {
				comparedTo.some(function(otherObj, i) {
					if(!taken[otherObj.__id__] && equal(obj.text, otherObj.text)) {
						id = otherObj.__id__;
						taken[otherObj.__id__] = true;
						prev = i;
						return true;
					}
				});
			}
			obj.__id__ = id;
			return obj;
		}).map(function(obj) {
			if(!obj.__id__) {
				var id;
				comparedTo.some(function(otherObj, i) {
					if(!taken[otherObj.__id__] && similar(obj.text, otherObj.text)) {
						id = otherObj.__id__;
						taken[otherObj.__id__] = true;
						prev = i;
						return true;
					}
				});
				if(!id) {
					id = ++ctr;
				}
				obj.__id__ = id;
			}
			return obj;
		});
	}
	function join(objs, by) {
		return objs.filter(function(obj) { return obj; }).map(function(obj) {
			return obj.text;
		}).join(by);
	}
	function extend(target) {
		[].slice.call(arguments, 1).forEach(function(obj) {
			Object.keys(obj).forEach(function(key) {
				var value = obj[key];
				if(value != null && value.constructor === Object) {
					if(target.hasOwnProperty(key)) extend(target[key], value);
					else target[key] = extend({}, value);
				}
				else if(value === undefined) delete target[key];
				else target[key] = value;
			});
		});
		return target;
	}
	function clone(objs) { return objs.map(function(obj) { return extend({}, obj); }); }
	function _equal(first, second) {
		return first === second;
	}
	function _similar(first, second) {
		return first.length > 100 && levenshteinDistance(first, second) / first.length < 0.2;
	}
	parent = split(parent, '\n', _equal, _similar, []);
	first = split(first, '\n', _equal, _similar, clone(parent));
	second = split(second, '\n', _equal, _similar, clone(parent).concat(clone(first)));
	
	var parent_lines = {};
	parent.forEach(function(line) {
		parent_lines[line.__id__] = line.text;
	});
	var first_lines = {};
	first.forEach(function(line) {
		first_lines[line.__id__] = line.text;
	});
	var second_lines = {};
	second.forEach(function(line) {
		second_lines[line.__id__] = line.text;
	});
	var all = parent.concat(first).concat(second);
	var merged_lines = {};
	
	all.forEach(function(line) {
		if(merged_lines.hasOwnProperty(line.__id__)) return;
		
		if(parent_lines[line.__id__] === first_lines[line.__id__]) {
			merged_lines[line.__id__] = second_lines[line.__id__];
			return;
		} else if(parent_lines[line.__id__] === second_lines[line.__id__]) {
			merged_lines[line.__id__] = first_lines[line.__id__];
			return;
		} else if(first_lines[line.__id__] === second_lines[line.__id__]) {
			merged_lines[line.__id__] = first_lines[line.__id__];
			return;
		}
		
		function _equal(first, second) {
			return first === second;
		}
		function _similar() {
			return false;
		}
		
		var parent = split(parent_lines[line.__id__] || '', /\b/, _equal, _similar, []);
		var first = split(first_lines[line.__id__] || '', /\b/, _equal, _similar, clone(parent));
		var second = split(second_lines[line.__id__] || '', /\b/, _equal, _similar, clone(parent).concat(clone(first)));
		
		merged_lines[line.__id__] = join(set.merge3(parent, first, second, resolve), '');
	});
	
	var merged = set.merge3(parent, first, second, resolve).map(function(obj) {
		return merged_lines[obj.__id__];
	}).join('\n');
	
	return merged;
};