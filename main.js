function init() {
	// Attach event listeners
	for (const node of document.querySelectorAll('.button')) {
		clickAndEnter(node, buttonClick);
	}
	let isAnimating = false;
	clickAndEnter(document.querySelector('#permalink'), function(e) {
		e.preventDefault();
		if (isAnimating) return;
		isAnimating = true;
		navigator.clipboard.writeText(this.href);
		let node = document.querySelector('.copy-text');
		node.classList.remove('hidden');
		setTimeout(function() {
			node.style.top = '-24px';
			node.style.opacity = '0';
			setTimeout(function() {
					node.classList.add('hidden');
					node.style.top = '';
					node.style.opacity = '';
					isAnimating = false;
				}, 1000);
			}, 5);
	});
	// Give input boxes autocomplete behavior
	addAutocomplete(document.querySelector('#geneInput1'), document.GeneBrowser_geneDB, 'gene');
	addAutocomplete(document.querySelector('#geneInput2'), document.GeneBrowser_geneDB, 'gene');
	addAutocomplete(document.querySelector('#monstieInput'), document.GeneBrowser_monstieDB, 'monstie');
	document.querySelector('#geneInput1').addEventListener('input', geneInputListener1);
	document.querySelector('#geneInput2').addEventListener('input', geneInputListener2);
	document.querySelector('#monstieInput').addEventListener('input', monstieInputListener);
	createDropdown(document.querySelector('#geneTypeSelection'), ['---', 'Power', 'Speed', 'Technical', 'No Type'], 'type');
	createDropdown(document.querySelector('#geneElemSelection'), ['---', 'Non-Elem', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'], 'element');
	// Load stuff from storage, and check args
	loadLocalStorage();
	applyParams();
	updatePermalinkAndStorage();
}

function loadLocalStorage() {
	const storage = window.localStorage;
	// const lastPage = storage.getItem('lastPage');
	// Update first page
	document.querySelector('#geneInput1').value = storage.getItem('geneInput') || '';
	document.querySelector('#geneInput1').dispatchEvent(new Event('input'));
	// Update second page
	document.querySelector('#monstieInput').value = storage.getItem('monstieInput') || '';
	document.querySelector('#monstieInput').dispatchEvent(new Event('input'));
	// Update third page
	let val1, val2;
	[val1, val2] = (storage.getItem('geneFilter') || '').split(',');
	val1 = ['---', 'Power', 'Speed', 'Technical', 'No Type'][parseInt(val1, 10)] || '---';
	val2 = ['---', 'Non-Elem', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'][parseInt(val2, 10)] || '---';
	document.querySelector('#geneTypeSelection').setAttribute('data-value', val1);
	document.querySelector('#geneElemSelection').setAttribute('data-value', val2);
	applyGeneFilter();
	// Update fourth page
	let geneList = document.querySelector('#includedGeneList');
	let content = storage.getItem('genesLookup') || '';
	for (const geneId of content.split(',')) {
		if (document.querySelector(`[data-value="${geneId}"]`)) return;
		let geneEntry = document.GeneBrowser_geneDB[geneId];
		if (geneEntry === undefined) continue;
		let geneNode = geneToNode(geneEntry);
		geneNode.setAttribute('data-value', geneId);
		geneNode.setAttribute('tabindex', 0);
		clickAndEnter(geneNode, function() {
			this.parentNode.removeChild(this);
			updatePermalinkAndStorage();
			updateGeneHaver();
		});
		geneList.appendChild(geneNode);
	}
	updateGeneHaver();
	/* Click only when everything is in place
	switch (lastPage) {
		case "0":
			document.querySelector('[data-page="geneBrowser"]').click();
			break;
		case "1":
			document.querySelector('[data-page="monstieBrowser"]').click();
			break;
		case "2":
			document.querySelector('[data-page="geneFilter"]').click();
			break;
		case "3":
			document.querySelector('[data-page="genesLookup"]').click();
			break;
	}
	*/
}

function applyParams() {
	let page, content, params = (new URL(document.location)).searchParams;
	page = params.get('pg');
	content = params.get('val') || '';
	switch (page) {
		case "0":
			document.querySelector('#geneInput1').value = content;
			document.querySelector('#geneInput1').focus();
			document.querySelector('#geneInput1').dispatchEvent(new Event('input'));
			document.querySelector('[data-page="geneBrowser"]').click();
			break;
		case "1":
			document.querySelector('#monstieInput').value = content;
			document.querySelector('#monstieInput').focus();
			document.querySelector('#monstieInput').dispatchEvent(new Event('input'));
			document.querySelector('[data-page="monstieBrowser"]').click();
			break;
		case "2":
			let val1, val2;
			[val1, val2] = content.split(',');
			val1 = ['---', 'Power', 'Speed', 'Technical', 'No Type'][parseInt(val1, 10)] || '---';
			val2 = ['---', 'Non-Elem', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'][parseInt(val2, 10)] || '---';
			document.querySelector('#geneTypeSelection').setAttribute('data-value', val1);
			document.querySelector('#geneElemSelection').setAttribute('data-value', val2);
			applyGeneFilter();
			document.querySelector('#geneTypeSelection').focus();
			document.querySelector('[data-page="geneFilter"]').click();
			break;
		case "3":
			let geneList = document.querySelector('#includedGeneList');
			for (const geneId of content.split(',')) {
				if (document.querySelector(`[data-value="${geneId}"]`)) continue;
				let geneEntry = document.GeneBrowser_geneDB[geneId];
				if (geneEntry === undefined) continue;
				let geneNode = geneToNode(geneEntry);
				geneNode.setAttribute('data-value', geneId);
				geneNode.setAttribute('tabindex', 0);
				clickAndEnter(geneNode, function() {
					this.parentNode.removeChild(this);
					updatePermalinkAndStorage();
					updateGeneHaver();
				});
				geneList.appendChild(geneNode);
			}
			updateGeneHaver();
			document.querySelector('#geneInput2').focus();
			document.querySelector('[data-page="genesLookup"]').click();
			break;
		default:
			return;
	}
}

function updatePermalinkAndStorage() {
	let storage = window.localStorage;
	let pageNum, content, pageName = document.querySelector('.selected').getAttribute('data-page');
	switch (pageName) {
		case 'geneBrowser':
			pageNum = 0;
			content = document.querySelector('#geneInput1').value;
			break;
		case 'monstieBrowser':
			pageNum = 1;
			content = document.querySelector('#monstieInput').value;
			break;
		case 'geneFilter':
			pageNum = 2;
			let val1, val2;
			val1 = ['---', 'Power', 'Speed', 'Technical', 'No Type'].indexOf(document.querySelector('#geneTypeSelection').getAttribute('data-value'));
			val2 = ['---', 'Non-Elem', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'].indexOf(document.querySelector('#geneElemSelection').getAttribute('data-value'));
			if (val1 === -1) val1 = 0;
			if (val2 === -1) val2 = 0;
			content = `${val1},${val2}`;
			break;
		case 'genesLookup':
			pageNum = 3;
			content = [...document.querySelectorAll('#includedGeneList>.gene-entry')].map(x => x.getAttribute('data-value'));
			content = content.join(',');
			break;
		default:
			pageNum = 0;
			content = '';
	}
	document.querySelector('#permalink').href = `?pg=${pageNum}&val=${content}`;
	history.replaceState(history.state, '', `?pg=${pageNum}&val=${content}`);
	// Storage update
	storage.setItem('lastPage', pageNum);
	storage.setItem('geneInput', document.querySelector('#geneInput1').value);
	storage.setItem('monstieInput', document.querySelector('#monstieInput').value);
	let val1, val2;
	val1 = ['---', 'Power', 'Speed', 'Technical', 'No Type'].indexOf(document.querySelector('#geneTypeSelection').getAttribute('data-value'));
	val2 = ['---', 'Non-Elem', 'Fire', 'Water', 'Thunder', 'Ice', 'Dragon'].indexOf(document.querySelector('#geneElemSelection').getAttribute('data-value'));
	if (val1 === -1) val1 = 0;
	if (val2 === -1) val2 = 0;
	storage.setItem('geneFilter', `${val1},${val2}`);
	storage.setItem('genesLookup', [...document.querySelectorAll('#includedGeneList>.gene-entry')].map(x => x.getAttribute('data-value')).join(','));
}

function buttonClick() {
	// Mark button as selected
	for (const node of document.querySelectorAll('.button')) node.classList.remove('selected');
	this.classList.add('selected');
	// Show only relevant page
	let targetPage = this.getAttribute('data-page');
	for (const node of document.querySelectorAll('.page')) node.classList.add('hidden');
	document.getElementById(targetPage).classList.remove('hidden');
	updatePermalinkAndStorage();
}

function geneInputListener1() {
	let geneId, found = false;
	for (const [gId, entry] of Object.entries(document.GeneBrowser_geneDB))
		if (entry.geneName === this.value) {
			geneId = gId;
			found = true;
			break;
		}
	if (!found) return;
	let sectionRow = document.querySelector('#geneFirstRow');
	for (let i=0; i<4; i++) {
		sectionRow.classList.remove('hidden');
		sectionRow = sectionRow.nextElementSibling;
	}
	let geneEntry = document.GeneBrowser_geneDB[geneId];
	// Update gene info panel
	let geneIcon = document.querySelector('#selectedGeneIcon');
	geneIcon.innerHTML = '';
	let geneIconDiv = geneToIcon(geneEntry);
	while (geneIconDiv.firstChild) geneIcon.appendChild(geneIconDiv.firstChild);
	document.querySelector('#selectedGeneName').innerText = geneEntry.geneName;
	let skillIcon = document.querySelector('#selectedGeneSkillIcon');
	skillIcon.classList.remove(...skillIcon.classList.values());
	skillIcon.classList.add('icon-wrapper', geneEntry.isActiveSkill ? geneEntry.skillType.toLowerCase() : 'passive');
	let skillElem = document.querySelector('#selectedGeneSkillElem');
	if (geneEntry.skillElement && ['Power', 'Speed', 'Technical', 'Offensive'].includes(geneEntry.skillType)) {
		skillElem.classList.remove(...skillElem.classList.values());
		skillElem.classList.add('skill-elem');
		skillElem.classList.add(geneEntry.skillElement.toLowerCase());
	} else {
		skillElem.classList.add('hidden');
	}
	document.querySelector('#selectedGeneSkillName').innerText = geneEntry.skillName;
	// Update monstie list
	for (const mType of ['fixed', 'random']) {
		let counter = 0
		if (mType === 'fixed') listNode = document.querySelector('#fixedMonstieList')
		else listNode = document.querySelector('#randomMonstieList');
		while (listNode.firstChild) listNode.removeChild(listNode.lastChild);
		for (const mId of geneEntry.monsties[mType]) {
			const monstieEntry = document.GeneBrowser_monstieDB[mId.toString()];
			let d = document.createElement('div');
			d.classList.add('monstie-entry');
			d.innerHTML = `<img src="img/monstie/${mId}.png"><div>${monstieEntry.name}</div>`;
			d.setAttribute('data-value', monstieEntry.name);
			d.setAttribute('tabindex', 0);
			clickAndEnter(d, function() {
				document.querySelector('#monstieInput').value = this.getAttribute('data-value');
				document.querySelector('#monstieInput').dispatchEvent(new Event('input'));
				document.querySelector('[data-page="monstieBrowser"]').click();
				document.querySelector('#monstieInput').focus();
				return;
			});
			listNode.appendChild(d);
			counter++;
		}
		if (counter === 0) {
			listNode.classList.add('hidden');
			listNode.previousElementSibling.classList.add('hidden');
		}
	}
}

function geneInputListener2() {
	let geneId, found = false;
	for (const [gId, entry] of Object.entries(document.GeneBrowser_geneDB))
		if (entry.geneName === this.value) {
			geneId = gId;
			found = true;
			break;
		}
	if (!found) return;
	if (document.querySelector(`[data-value="${geneId}"]`)) return;
	let geneEntry = document.GeneBrowser_geneDB[geneId];
	// Add to selected genes list
	let geneList = document.querySelector('#includedGeneList');
	let geneNode = geneToNode(geneEntry);
	geneNode.setAttribute('data-value', geneId);
	geneNode.setAttribute('tabindex', 0);
	clickAndEnter(geneNode, function() {
		this.parentNode.removeChild(this);
		updatePermalinkAndStorage();
		updateGeneHaver();
	});
	geneList.appendChild(geneNode);
	this.value = '';
	updateGeneHaver();
}

function monstieInputListener() {
	let monstieId, found = false;
	for (const [mId, entry] of Object.entries(document.GeneBrowser_monstieDB))
		if (entry.name === this.value) {
			monstieId = mId;
			found = true;
			break;
		}
	if (!found) return;
	let sectionRow = document.querySelector('#monstieFirstRow');
	for (let i=0; i<4; i++) {
		sectionRow.classList.remove('hidden');
	sectionRow = sectionRow.nextElementSibling;
	}
	let monstieEntry = document.GeneBrowser_monstieDB[monstieId];
	// Update monstie info panel
	document.querySelector('#selectedMonstieName').innerText = monstieEntry.name;
	document.querySelector('#selectedMonstieName').previousSibling.src = `img/monstie/${monstieId}.png`;
	document.querySelector('#selectedMonstieTypeIcon').classList.remove('power', 'speed', 'technical');
	document.querySelector('#selectedMonstieTypeIcon').classList.add(monstieEntry.type.toLowerCase());
	document.querySelector('#selectedMonstieType').innerText = monstieEntry.type;
	document.querySelector('.egg-display').firstChild.src = `https://cdn.kiranico.net/file/kiranico/mhstories-web/eggs/buddy_${monstieEntry.eggId}.png`;
	// Update gene list
	monstieId = parseInt(monstieId, 10);
	let inherentGeneList = document.querySelector('#inherentGeneList');
	let randomGeneList = document.querySelector('#randomGeneList');
	while (inherentGeneList.firstChild) inherentGeneList.removeChild(inherentGeneList.lastChild);
	while (randomGeneList.firstChild) randomGeneList.removeChild(randomGeneList.lastChild);
	for (const gene of Object.values(document.GeneBrowser_geneDB)) {
		let node = null;
		if (gene.monsties.fixed.includes(monstieId)) node = inherentGeneList
		else if (gene.monsties.random.includes(monstieId)) node = randomGeneList;
		if (node === null) continue;
		let geneNode = geneToNode(gene);
		geneNode.setAttribute('data-value', gene.geneName);
		geneNode.setAttribute('tabindex', 0);
		clickAndEnter(geneNode, function() {
			document.querySelector('#geneInput1').value = this.getAttribute('data-value');
			document.querySelector('#geneInput1').dispatchEvent(new Event('input'));
			document.querySelector('[data-page="geneBrowser"]').click();
			document.querySelector('#geneInput1').focus();
			return;
		});
		node.appendChild(geneNode);
	}
}

function updateGeneHaver() {
	let geneIdList = [...document.querySelectorAll('#includedGeneList>.gene-entry')].map(x => x.getAttribute('data-value'));
	let geneHaverList = document.querySelector('#geneHaverList');
	while (geneHaverList.firstChild) geneHaverList.removeChild(geneHaverList.lastChild);
	geneHaverList.classList.add('hidden');
	geneHaverList.previousElementSibling.classList.add('hidden');
	if (geneIdList.length === 0) return;
	let monsties = {};
	for (const geneId of geneIdList) {
		let geneEntry = document.GeneBrowser_geneDB[geneId];
		for (const [idx, mType] of Object.entries(['fixed', 'random'])) {
			for (const monstieId of geneEntry.monsties[mType]) {
				if (monsties[monstieId] === undefined) monsties[monstieId] = [0, 0];
				monsties[monstieId][idx]++;
			}
		}
	}
	console.log(monsties);
	monsties = Object.entries(monsties);
	monsties.sort(function(a, b) {
		let at, bt;
		at = a[1][0] + a[1][1];
		bt = b[1][0] + b[1][1];
		if (at === bt) return b[1][0] - a[1][0];
		return bt - at;
	});
	for (let monstie of monsties) {
		let monstieEntry = document.GeneBrowser_monstieDB[monstie[0]];
		let d, container = document.createElement('div');
		container.classList.add('gene-haver-entry');
		d = document.createElement('div');
		d.classList.add('monstie-entry');
		d.innerHTML = `<img src="img/monstie/${monstie[0]}.png"><div>${monstieEntry.name}</div>`;
		d.setAttribute('data-value', monstieEntry.name);
		d.setAttribute('tabindex', 0);
		clickAndEnter(d, function() {
			document.querySelector('#monstieInput').value = this.getAttribute('data-value');
			document.querySelector('#monstieInput').dispatchEvent(new Event('input'));
			document.querySelector('[data-page="monstieBrowser"]').click();
			document.querySelector('#monstieInput').focus();
			return;
		});
		container.appendChild(d);
		d = document.createElement('div');
		d.classList.add('number-text');
		d.innerHTML = `<div>${monstie[1][0]} inherent</div><div>${monstie[1][1]} random</div>`;
		container.appendChild(d);
		geneHaverList.appendChild(container);
	}
	geneHaverList.classList.remove('hidden');
	geneHaverList.previousElementSibling.classList.remove('hidden');
}

function applyGeneFilter() {
	let geneType = document.querySelector('#geneTypeSelection').getAttribute('data-value');
	let geneElem = document.querySelector('#geneElemSelection').getAttribute('data-value');
	// Update the selected option text
	// gene type
	document.querySelector('#selectedGeneTypeIcon').classList.remove(...document.querySelector('#selectedGeneTypeIcon').classList);
	document.querySelector('#selectedGeneTypeIcon').classList.add('icon-wrapper');
	if (geneType === '---') document.querySelector('#selectedGeneTypeIcon').classList.add('hidden')
	else document.querySelector('#selectedGeneTypeIcon').classList.add(geneType === 'No Type' ? 'debuff' : geneType.toLowerCase());
	document.querySelector('#selectedGeneType').innerText = geneType;
	// gene element
	document.querySelector('#selectedGeneElemIcon').classList.remove(...document.querySelector('#selectedGeneElemIcon').classList);
	document.querySelector('#selectedGeneElemIcon').classList.add('skill-elem');
	if (geneElem === '---') document.querySelector('#selectedGeneElemIcon').classList.add('hidden')
	else document.querySelector('#selectedGeneElemIcon').classList.add(geneElem.toLowerCase());
	document.querySelector('#selectedGeneElem').innerText = geneElem;
	// Clear existing list
	let geneList = document.querySelector('#filterResult');
	geneList.classList.add('hidden');
	geneList.previousElementSibling.classList.add('hidden');
	while (geneList.firstChild) geneList.removeChild(geneList.lastChild);
	if (geneType === '---' && geneElem === '---') return;
	// Add genes into the list
	for (const gene of Object.values(document.GeneBrowser_geneDB)) {
		if (geneType !== '---' && !gene.geneType.startsWith(geneType)) continue;
		if (geneElem !== '---' && !gene.geneElement.startsWith(geneElem)) continue;
		let geneNode = geneToNode(gene);
		geneNode.setAttribute('data-value', gene.geneName);
		geneNode.setAttribute('tabindex', 0);
		clickAndEnter(geneNode, function() {
			document.querySelector('#geneInput1').value = this.getAttribute('data-value');
			document.querySelector('#geneInput1').dispatchEvent(new Event('input'));
			document.querySelector('[data-page="geneBrowser"]').click();
			document.querySelector('#geneInput1').focus();
			return;
		});
		geneList.appendChild(geneNode);
	}
	geneList.classList.remove('hidden');
	geneList.previousElementSibling.classList.remove('hidden');
}

function geneToIcon(gene) {
	let geneIconDiv = document.createElement('div');
	geneIconDiv.classList.add('gene-icon');
	geneIconDiv.innerHTML = `<div class="base"></div><div class="${gene.geneElement.toLowerCase()}"></div><div class="size-${gene.geneSize}"></div><div class="${gene.geneType === 'No Type' ? '' : gene.geneType.toLowerCase().match(/\w+/)[0]}"></div>`;
	return geneIconDiv;
}

function geneToNode(gene) {
	let entryDiv = document.createElement('div');
	entryDiv.classList.add('gene-entry');
	let skillType = gene.isActiveSkill ? gene.skillType.toLowerCase() : 'passive';
	let skillNameHtml = `<div class="skill-info"><div class="icon-wrapper ${skillType}"><div class="type-icon"></div></div>`;
	if (gene.skillElement && ['Power', 'Speed', 'Technical', 'Offensive'].includes(gene.skillType)) skillNameHtml += `<div class="skill-elem ${gene.skillElement.toLowerCase()}"></div>`
	skillNameHtml += `<div class="left-margin">${gene.skillName}</div>`;
	entryDiv.appendChild(geneToIcon(gene));
	entryDiv.innerHTML += `<div><div>${gene.geneName}</div><div class="left-margin">${skillNameHtml}</div></div>`;
	return entryDiv;
}

function addAutocomplete(inp, obj, type) {
	let currentFocus;
	// On focus, show dropdown
	inp.addEventListener('focus', function(e) {
		inp.dispatchEvent(new Event('input'));
	});
	// On input, create dropdown
	inp.addEventListener('input', function(e) {
		closeAllLists();
		let a, b, val = this.value;
		if (!val) return false;
		currentFocus = -1;
		a = document.createElement('div');
		a.setAttribute('id', this.id + 'autocomplete-list');
		a.setAttribute('class', 'autocomplete-items');
		this.parentNode.appendChild(a);
		let dropdownCount = 0;
		for (const [key, entry] of Object.entries(obj)) {
			let entryText, entryPrefixNode;
			if (type === 'gene') {
				entryText = entry.geneName;
				entryPrefixNode = geneToIcon(entry);
			} else if (type === 'monstie') {
				entryText = entry.name;
				entryPrefixNode = document.createElement('img');
				entryPrefixNode.src = `img/monstie/${key}.png`;
			} else return;
			if (inp.id === 'geneInput2' && document.querySelector(`#genesLookup [data-value="${key}"]`)) continue;
			if (entryText.toLowerCase().includes(val.toLowerCase())) {
				b = document.createElement('div');
				b.appendChild(entryPrefixNode);
				let substrIndex = entryText.toLowerCase().indexOf(val.toLowerCase());
				b.innerHTML += entryText.substr(0, substrIndex);
				b.innerHTML += `<strong>${entryText.substr(substrIndex, val.length)}</strong>`;
				b.innerHTML += entryText.substr(substrIndex + val.length);
				b.setAttribute('data-value', entryText);
				b.addEventListener('click', function(e) {
					inp.value = this.getAttribute('data-value');
					inp.dispatchEvent(new Event('input'));
					inp.focus();
					closeAllLists();
					updatePermalinkAndStorage();
				});
				a.appendChild(b);
				// Arbitrary limitation on dropdown size
				dropdownCount++;
				if (dropdownCount >= 10) break;
			}
		}
		if (dropdownCount === 1 && a.firstChild.getAttribute('data-value') === val) {
			a.parentNode.removeChild(a);
		}
	});
	// On keypress, navigate dropdown
	inp.addEventListener('keydown', function(e) {
		let x = document.getElementById(this.id + 'autocomplete-list');
		if (x) x = x.childNodes;
		if (e.code === 'ArrowDown') {
			e.preventDefault();
			currentFocus++;
			addActive(x);
		} else if (e.code === 'ArrowUp') {
			e.preventDefault();
			currentFocus--;
			addActive(x);
		} else if (e.code === 'Enter') {
			e.preventDefault();
			if (currentFocus > -1 && x) x[currentFocus].click();
		} else if (e.code === 'Escape') {
			closeAllLists();
		}
	});
	function addActive(x) {
		// Mark element active
		if (!x) return false;
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		x[currentFocus].classList.add('autocomplete-active');
	}
	function removeActive(x) {
		// Remove "active" from all elements
		for (let y of x) y.classList.remove('autocomplete-active');
	}
	function closeAllLists(elmnt) {
		// Close all autocomplete lists except
		// the one passed as an argument.
		for (let x of document.getElementsByClassName('autocomplete-items'))
			if (!x.parentNode.contains(elmnt))
				x.parentNode.removeChild(x);
	}
	// When dropdown loses focus, close it
	document.addEventListener('click', function (e) {
		closeAllLists(e.target);
	});
}

function createDropdown(inp, obj, type) {
	let currentFocus;
	// On click, create dropdown (how to do this with keydown?)
	clickAndEnter(inp, function(e) {
		if (this.classList.contains('active')) {
			closeAllLists();
			return;
		}
		this.classList.add('active');
		let a, b;
		currentFocus = -1;
		a = document.createElement('div');
		a.setAttribute('id', this.id + 'autocomplete-list');
		a.setAttribute('class', 'dropdown-items');
		this.parentNode.appendChild(a);
		for (const entry of obj) {
			let entryText, entryPrefixNode;
			if (type === 'type') {
				entryText = entry;
				entryPrefixNode = document.createElement('div');
				if (entryText === '---') {
				} else if (entryText === 'No Type') {
					entryPrefixNode.classList.add('icon-wrapper', 'debuff');
					entryPrefixNode.innerHTML = '<div class="type-icon"></div>';
				} else {
					entryPrefixNode.classList.add('icon-wrapper', entryText.toLowerCase());
					entryPrefixNode.innerHTML = '<div class="type-icon"></div>';
				}
			} else if (type === 'element') {
				entryText = entry;
				entryPrefixNode = document.createElement('div');
				if (entryText !== '---') {
					entryPrefixNode.classList.add('skill-elem', entryText.toLowerCase());
				}
			} else return;
			b = document.createElement('div');
			b.appendChild(entryPrefixNode);
			b.innerHTML += `<div class="left-margin">${entryText}</div>`;
			b.setAttribute('data-value', entryText);
			b.addEventListener('click', function(e) {
				a.previousElementSibling.setAttribute('data-value', this.getAttribute('data-value'));
				inp.focus();
				closeAllLists();
				applyGeneFilter();
				updatePermalinkAndStorage();
			});
			a.appendChild(b);
		}
	});
	// On keypress, navigate dropdown
	inp.addEventListener('keydown', function(e) {
		let x = document.getElementById(this.id + 'autocomplete-list');
		if (x) x = x.childNodes;
		if (e.code === 'ArrowDown') {
			currentFocus++;
			addActive(x);
		} else if (e.code === 'ArrowUp') {
			currentFocus--;
			addActive(x);
		} else if (e.code === 'Enter') {
			if (currentFocus > -1 && x) x[currentFocus].click();
		} else if (e.code === 'Escape') {
			closeAllLists();
		}
	});
	function addActive(x) {
		// Mark element active
		if (!x) return false;
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		x[currentFocus].classList.add('autocomplete-active');
	}
	function removeActive(x) {
		// Remove "active" from all elements
		for (let y of x) y.classList.remove('autocomplete-active');
	}
	function closeAllLists(elmnt) {
		// Close all autocomplete lists except
		// the one passed as an argument.
		for (let x of document.getElementsByClassName('dropdown-items'))
			if (!x.parentNode.contains(elmnt)) {
				x.previousElementSibling.classList.remove('active');
				x.parentNode.removeChild(x);
			}
	}
	// When dropdown loses focus, close it
	document.addEventListener('click', function(e) {
		closeAllLists(e.target);
	});
}

function clickAndEnter(el, func) {
	el.addEventListener('click', function(e) {
		func.call(this, e);
	});
	el.addEventListener('keydown', function(e) {
		if (e.code !== 'Enter' && e.code !== 'Space') return;
		e.preventDefault();
		func.call(this, e);
	});
}