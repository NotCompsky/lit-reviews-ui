const data = {"screeds":{}, [["1923", "The Forgotten Crisis in the Year of Hitler's Coup", ["Mark Jones"], ["nonfiction", "ww2"], 7, "1.jpg", "A very interesting part of history that is often ignored.\n\n<p>I remember in IGCSE History it was basically all about: <code>Treaty of Versailles</code> &gt; <code>hyperinflation due to the French occupation of the industry-rich German west</code> &gt; <code>Hitler's coup attempt</code></p>\n\n<p>After reading this book, I realised I had never asked an important question - why wasn't Hitler elected sooner? Everything that was in Hitler's favour in 1933 had peaked in 1923.</p>\n\n<p>This book indirectly answers that question. I think the main answer is that it took a decade for Nazism to replace the conservatives - those who wanted a return to monarchy and who viewed Nazism as too revolutionary.</p>\n\n<p>I think the same happened with Donald Trump - it took him a decade to take over the Republican Party. He achieved almost nothing in his first term, because all the establishment Republican Party obstructed him at every turn, and he had almost no loyalists in office. But by 2025, all the 'Never Trump' Republicans had joined the Democratic Party, thus in his second term he was firing from all barrels - he appointed loyalists to all cabinet positions, he had a legal strategy to gut the liberal-leaning federal agencies (USAID, etc) and even his former establishment opponents (Marco Rubio) joined the loyalists.</p>"], ["Cruel Brittania", "A Secret History of Torture", ["Ian Cobain"], ["nonfiction", "history"], 9, "2.jpg", ""], ["This Dark Business", "The secret war against Napoleon", ["Tim Clayton"], ["nonfiction", "history", "spies"], 7, "3.jpg", ""]]};

const tag2parents = {};
{
	const parents = [];
	for (let line of `TAG_HEIRARCHY_STR`.split("\n")){
		if (line.length === 0)
			continue;
		let n_tabs = 0;
		while(line.charCodeAt(n_tabs) === 9){
			++n_tabs;
		}
		const tagname = line.substr(n_tabs);
		
		let ls = tag2parents[tagname];
		if (ls === undefined)
			ls = [];
		for (let i = n_tabs-1;  i >= 0;  --i){
			if (!ls.includes(parents[i])){
				ls.push(parents[i]);
			}
		}
		tag2parents[tagname] = ls;
		
		parents[n_tabs] = tagname;
	}
	while(true){
		let n_changes = 0;
		for (let [key,ls] of Object.entries(tag2parents)){
			for (let i = 0;  i < ls.length;  ++i){
				const parent_tag = ls[i];
				for (let grandparent_tag of tag2parents[parent_tag]){
					if (!ls.includes(grandparent_tag)){
						ls.push(grandparent_tag);
						++n_changes;
					}
				}
			}
		}
		if (n_changes === 0)
			break;
	}
	console.log("tag2parents",tag2parents);
}

let s1 = "";
const all_authors = ["(EMPTY)","<ANY MALE>","<ANY FEMALE>"];
const all_tags = ["(EMPTY)",ALL_CATEGORY_TAGS];
const tag2numuses = {};
for (let key of ["",ALL_CATEGORY_TAGS]){
	tag2numuses[key] = new Array(all_tags.length);
	tag2numuses[key].fill(0);
}

const man_names = `Bob
C S Forester
Cixin Liu
J J Abrams
J R R Tolkien`.split("\n");
const man_firstnames = `Adam
Aldous
Alexander
Allan
Andrew
Andrzej
Arthur
Austin
Benjamin
Bernard
Bob
Chad
Charlie
Chris
Christopher
Craig
Daniel
Daron
David
Douglas
Ed
Edgar
Ewan
Frank
Frederik
Geoffrey
George
Gordon
Graham
Hans
Hugh
Ian
Isaac
Jack
Jake
James
Javier
Jeremy
Jim
Jimmy
John
Jonathan
Justin
Keanu
Klaus
Kurt
Lee
Leo
Leonardo
Liam
Mark
Matt
Matthew
Michael
Nicolas
Noah
Oliver
Orson
Peter
Philip
Ray
Richard
Ricky
Robert
Simon
Stephen
Steven
Tim
Timothy
Thomas
Tom
William`.split("\n");
const woman_firstnames = `Alice
Angela
Anna
Annie
Caroline
Carolyn
Dasha
Donna
Emily
Enid
Eve
Gillian
Jennifer
Katherine
Lauren
Mathilde
Naomi
Natascha
Nicole
Sandra
Veronica`.split("\n");
const woman_names = `J K Rowling`.split("\n");
const calculate_author_gender = full_name => {
	let rc = man_names.includes(full_name) | (woman_names.includes(full_name)<<1);
	if (rc === 0){
		const spacat = full_name.indexOf(" ");
		const dashat = full_name.indexOf("-");
		const firstname_length = (spacat===-1) ? dashat : ((dashat===-1) ? spacat : Math.min(spacat,dashat));
		if (firstname_length > 1){
			const firstname = full_name.substr(0,firstname_length);
			rc |= man_firstnames.includes(firstname);
			rc |= (woman_firstnames.includes(firstname) << 1);
		}
	}
	return rc;
};

const sorted_books = data["reviews"]; // .sort((a,b) => b[4]>a[4]); Sorting didn't seem to work on mobile
for (let i = 0;  i < sorted_books.length;  ++i){
	const [title,subtitle,authors,tags,score,coverimg_url,content,url,music] = sorted_books[i];
	
	let first_line_of_descr = "";
	let descrlen = 0;
	if (content !== ""){
		const txtnode = document.createElement("div");
		txtnode.innerHTML = content;
		first_line_of_descr = txtnode.innerText;
		descrlen = first_line_of_descr.length;
		if (descrlen > 150)
			first_line_of_descr = first_line_of_descr.substr(0,150) + "...";
		let first_newline = first_line_of_descr.indexOf("\n");
		if (first_newline !== -1){
			first_line_of_descr = first_line_of_descr.replaceAll(/\n+/g," _ ");
		}
	}
	
	s1 += ``+
`<div class="book" data-indx="${i}" data-score="${score}" data-descrlen="${descrlen}">`+
	`<img data-indx="${i}" class="book_thumb clicktogetreview" src="${coverimg_url}"/>`+
	`<span class="as_str">"</span>`+
	`<span data-indx="${i}" class="book_title clicktogetreview">${title}</span>`;
	if (subtitle !== null)
		s1 += `<span class="as_str">: </span><span data-indx="${i}" class="book_subtitle clicktogetreview">${subtitle}</span>`;
	s1 += ``+
	`<span class="as_str">", by </span>`+
	`<span class="book_authors flexorinline">`;
	for (let author of authors){
		if (!all_authors.includes(author))
			all_authors.push(author);
		const gender_id = calculate_author_gender(author);
		s1 += `<span data-i="${all_authors.indexOf(author)}" class="clickable_tag_or_author author ${(gender_id&1)?'male':''} ${(gender_id&2)?'female':''}">${author}</span>`;
	}
	s1 += `</span>`+
	`<span data-indx="${i}" class="book_rating clicktogetreview">`+
		`<span class="as_str"> (${(score===-1)?'?':score.toString()} stars). </span>`+
		`<span class="as_ico">`;
	if (score === -1){
		s1 += '?????';
	} else {
		for (let i = 0;  i < (score&14);  i+=2)
			s1 += '★'; // ⭐ is yellow star on Firefox but small unfilled star on Chrome
		if ((score&1) === 1)
			s1 += '⯪';
		for (let i = (score&15);  i < 9;  i+=2)
			s1 += '☆';
	}
	s1 += `</span>`+
	`</span>`+
	`<span class="book_tags flexorinline">`+
		`<span class="as_str">Tags:</span>`;
	const tag_indices = [];
	for (let tag of tags){
		if (!all_tags.includes(tag)){
			all_tags.push(tag);
			for (key of Object.keys(tag2numuses))
				tag2numuses[key].push(0);
		}
		const tag_indx = all_tags.indexOf(tag);
		tag_indices.push(tag_indx);
		s1 += ` <span data-i="${tag_indx}" class="clickable_tag_or_author tag tag_primary">${tag}</span>`;
	}
	for (let tag of tags){
		const parent_tags = tag2parents[tag];
		if (parent_tags !== undefined){
			for (parent_tag of parent_tags){
				if (!tags.includes(parent_tag)){
					if (!all_tags.includes(parent_tag)){
						all_tags.push(parent_tag);
						for (key of Object.keys(tag2numuses))
							tag2numuses[key].push(0);
					}
					const tag_indx = all_tags.indexOf(parent_tag);
					tag_indices.push(tag_indx);
					s1 += ` <span data-i="${tag_indx}" class="clickable_tag_or_author tag">${parent_tag}</span>`;
				}
			}
		}
	}
	for (key of Object.keys(tag2numuses)){
		if ((key==="") || tags.includes(key)){
			for (let tag_indx of tag_indices){
				++tag2numuses[key][tag_indx];
			}
		}
	}
	sorted_books[i][2] = authors.map(x => all_authors.indexOf(x));
	sorted_books[i][3] = tag_indices;
	
	s1 += ``+
	`</span>`+
	` <div class="book_descr">${first_line_of_descr}</div>`+
`</div>`;
}
const results_container = document.getElementById("results_container");

results_container.innerHTML = s1;

const reviewcontainer = document.getElementById("reviewcontainer");
const review_html = document.getElementById("review_html");
const review_title = document.getElementById("review_title");
const review_link = document.getElementById("review_link");
const review_audio = document.getElementById("review_audio");
const filter_authors_selection = document.getElementById("filter_authors_selection");
const filter_tags_selection = document.getElementById("filter_tags_selection");

review_audio.volume = 0.1;
review_audio.addEventListener("loadeddata", ()=>{
	console.log("Loaded", review_audio.src);
	review_audio.play();
});

let currently_viewing_review_of_indx = -1;
const display_book_review_onclickfn = e => {
	const book_indx = e.currentTarget.dataset.indx|0;
	const [title,subtitle,authors,tags,score,coverimg_url,content,url,music] = sorted_books[book_indx];
	
	if (book_indx === currently_viewing_review_of_indx)
		reviewcontainer.classList.toggle("hidden");
	else {
		currently_viewing_review_of_indx = book_indx;
		
		if (url === null)
			review_link.classList.add("hidden");
		else {
			review_link.classList.remove("hidden");
			review_link.href = url;
		}
		
		if (music === null){
			review_audio.classList.add("hidden");
			review_audio.pause();
		} else {
			review_audio.classList.remove("hidden");
			review_audio.src = music;
		}
		review_title.innerText = title;
		review_html.innerHTML =  content;
		
		reviewcontainer.classList.remove("hidden");
	}
	reviewcontainer.scrollIntoView();
};
for (let node of results_container.getElementsByClassName("clicktogetreview")){
	node.addEventListener("pointerup", display_book_review_onclickfn);
}
document.getElementById("closereview").addEventListener("pointerup", ()=>{
	reviewcontainer.classList.add("hidden");
});

const add_tag_to_filter = indx => {
	const newobj = document.createElement("span");
	newobj.innerText = newobj.dataset.name = all_tags[indx];
	newobj.dataset.i = indx;
	newobj.classList.add("tag");
	add_delbtn(newobj);
	filter_tags_current.appendChild(newobj);
	update_current_filter();
};
const add_tag_to_filter_from_click = e => {
	add_tag_to_filter(e.currentTarget.dataset.i|0);
};
for (let node of results_container.getElementsByClassName("tag")){
	node.addEventListener("pointerup", add_tag_to_filter_from_click);
}

const add_author_to_filter = indx => {
	const newobj = document.createElement("span");
	newobj.innerText = newobj.dataset.name = all_authors[indx];
	newobj.dataset.i = indx;
	newobj.classList.add("author");
	add_delbtn(newobj);
	filter_authors_current.appendChild(newobj);
	update_current_filter();
};
const add_author_to_filter_from_click = e => {
	add_author_to_filter(e.currentTarget.dataset.i|0);
};
for (let node of results_container.getElementsByClassName("author")){
	node.addEventListener("pointerup", add_author_to_filter_from_click);
}

const create_option = (value, text) => {
	// traditional method
	const opt = document.createElement("option");
	opt.value = value;
	opt.innerText = text;
	return opt;
	
	/* Using CSS trickery (from https://css-tricks.com/grouping-selection-list-items-together-with-css-grid/)
	const li  = document.createElement("li");
	const lbl = document.createElement("label");
	const inp = document.createElement("input");
	const txt = document.createElement("span");
	txt.innerText = text;
	lbl.appendChild(txt);
	inp.type = "checkbox";
	inp.dataset.value = value;
	lbl.appendChild(inp);
	li.appendChild(lbl);
	return li;*/
};
const update_author_options = displaytype => {
	const displaytype_indx = all_tags.indexOf(displaytype);
	const sorted_author_indices = all_authors.map((x,i) => [i,sorted_books.filter(y => y[2].includes(i) && y[3].includes(displaytype_indx)).length]).filter(x => (x[0]<=2)||(x[1]>0)).sort((a,b) => (a[0]<=2)^(b[1]>=a[1]));
	filter_authors_selection.innerHTML = "";
	for (let [author_indx, count] of sorted_author_indices){
		const author = all_authors[author_indx];
		const gender_id = calculate_author_gender(author);
		let author_prefix = " ";
		if ((gender_id&1) === 1)
			author_prefix = '♂️';
			// opt.classList.add("male");
		if ((gender_id&2) === 2)
			//opt.classList.add("female"); has no effect! Can't style <option>s apparently, at least on Firefox
			author_prefix = '♀️';
		filter_authors_selection.appendChild(create_option(author_indx, author_prefix + author + (count===0?"":" ["+count+"]")));
	}
};
const update_tag_options = displaytype => {
	const sorted_tag_indices = tag2numuses[displaytype].map((x,i) => [i,x]).filter(x => (x[0]===0)||(x[1]>0)).sort((a,b) => (a[0]===0)^(b[1]>=a[1]));
	filter_tags_selection.innerHTML = "";
	for (let [tag_indx, count] of sorted_tag_indices){
		filter_tags_selection.appendChild(create_option(tag_indx, all_tags[tag_indx] + " ["+count+"]"));
	}
};


const author2gender = all_authors.map(x => calculate_author_gender(x));

const current_filter = document.getElementById("current_filter");
const screed_container = document.getElementById("screed_container");
const filter_input_score_min = document.getElementById("filter_input_score_min");
const filter_input_score_max = document.getElementById("filter_input_score_max");
const filter_tags_current = document.getElementById("filter_tags_current");
const filter_authors_current = document.getElementById("filter_authors_current");
const displayonly_radiobtns = document.getElementsByClassName("displayonlyradiobtn");

const execute_filter = () => {
	let expr = "show = " + current_filter.value;
	expr = expr.replaceAll("authors.include(<ANY MALE>)", 'is_any_author_gender(authors,1)');
	expr = expr.replaceAll("authors.include(<ANY FEMALE>)", 'is_any_author_gender(authors,2)');
	for (let i = 1;  i < all_tags.length;  ++i){
		expr = expr.replaceAll("tags.include("+all_tags[i]+")", 'tags['+i+']');
	}
	for (let i = 3;  i < all_authors.length;  ++i){
		expr = expr.replaceAll("authors.include("+all_authors[i]+")", 'authors['+i+']');
	}
	// .replaceAll(/([0-9]+)/g,'filter_values["$1"]');
	
	let show = false;
	const tags = all_tags.map(x => false);
	const authors = all_authors.map(x => false);
	for (let node of results_container.childNodes){
		if (node.tagName === "DIV"){
			tags.fill(false);
			for (let i = 0;  i < all_authors.length;  ++i)
				authors[i] = false;
			
			const score = node.dataset.score|0;
			const description_length = node.dataset.descrlen|0;
			/*for (let subnode of node.getElementsByClassName("tag")){
				tags[subnode.dataset.i|0] = true;
			}
			for (let subnode of node.getElementsByClassName("author")){
				authors[subnode.dataset.i|0] = true;
			}*/
			for (let indx of sorted_books[node.dataset.indx|0][3]){
				tags[indx] = true;
			}
			for (let indx of sorted_books[node.dataset.indx|0][2]){
				authors[indx] = true;
			}
			
			if (expr === "show = ")
				show = true;
			else
				eval(expr);
			
			if (show)
				node.classList.remove("hidden");
			else
				node.classList.add("hidden");
		}
	}
};
const update_current_filter = () => {
	let s = "";
	
	for (let node of displayonly_radiobtns){
		if (node.checked){
			if (node.dataset.x !== "")
				s += ` && tags.include(${node.dataset.x})`;
			break;
		}
	}
	
	const score_min = filter_input_score_min.value;
	const score_max = filter_input_score_max.value;
	if (score_min !== "0")
		s += ` && (score>=${score_min})`;
	if (score_max !== "10")
		s += ` && (score<=${score_max})`;
	
	const ls = [];
	for (let typeobj of filter_tags_current.childNodes){
		if (typeobj.tagName === "SPAN")
			ls.push(`tags.include(${typeobj.dataset.name})`);
	}
	if (ls.length !== 0)
		s += " && (" + ls.join(" && ") + ")";
	
	ls.length = 0;
	for (let typeobj of filter_authors_current.childNodes){
		if (typeobj.tagName === "SPAN")
			ls.push(`authors.include(${typeobj.dataset.name})`);
	}
	if (ls.length !== 0)
		s += " && (" + ls.join(" || ") + ")";
	
	current_filter.value = s.substr(4);
	execute_filter();
};
const delbtn_fn = e => {
	e.currentTarget.parentNode.remove();
	update_current_filter();
};
const add_delbtn = parent => {
	const delbtn = document.createElement("button");
	delbtn.innerText = "X";
	delbtn.classList.add("rm");
	delbtn.addEventListener("pointerup", delbtn_fn);
	parent.appendChild(delbtn);
};
const update_displayonly = key => {
	screed_container.innerHTML = data["screeds"][key];
	update_tag_options(key);
	update_author_options(key);
	update_current_filter();
};

// add_tag_to_filter(?.indexOf("fiction"));
update_displayonly("book");


const is_any_author_gender = (author_bools, gender_id) => {
	let rc = false;
	for (let i = 0;  i < all_authors.length;  ++i){
		if (author_bools[i] && ((author2gender[i]&gender_id) === gender_id)){
			rc = true;
			break;
		}
	}
	return rc;
};

document.getElementById("filter_tags_selection").addEventListener("change", e => {
	const indx = e.currentTarget.value|0;
	
	if (indx !== 0){
		add_tag_to_filter(indx);
	}
});

document.getElementById("filter_authors_selection").addEventListener("change", e => {
	const indx = e.currentTarget.value|0;
	
	if (indx !== 0){
		add_author_to_filter(indx);
	}
});

filter_input_score_min.addEventListener("change", update_current_filter);
filter_input_score_max.addEventListener("change", update_current_filter);
document.getElementById("current_filter__edit").addEventListener("change", e => {
	current_filter.disabled = !e.currentTarget.checked;
});
current_filter.addEventListener("change", execute_filter);

const displayasradiobtn_fn = e => {
	if (e.currentTarget.checked){
		results_container.classList.toggle("results_as_str");
	}
};
for (let node of document.getElementsByClassName("displayasradiobtn")){
	node.addEventListener("change", displayasradiobtn_fn);
}

for (let node of document.getElementsByClassName("displayonlyradiobtn")){
	node.addEventListener("change", e => {
		update_displayonly(e.currentTarget.dataset.x);
	});
}
const set_css_var = (varname, val) => document.documentElement.style.setProperty(varname, val);
document.getElementById("showhide_tags_").addEventListener("change", e => {
	set_css_var("--tagdisplay", e.currentTarget.checked ? "unset": "none");
});
document.getElementById("showhide_descr").addEventListener("change", e => {
	set_css_var("--descrdisplay", e.currentTarget.checked ? "unset": "none");
});