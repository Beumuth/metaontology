let M = ((
    Module = {of: (f, ...args) => f.apply(undefined, args)},
    Arrays = {
        insertAt: (array, index, ...elements) => array.splice(index,0,...elements),
        count: (array, predicate) => array.reduce((count, symbol) => predicate(symbol) ? count + 1 : count, 0),
        bisect: (array, filter) => {
            const result = {true: [], false: []};
            array.forEach(x => result[filter(x)].push(x));
            return result;},
        categorize: (array, keyedFilters) => Object.fromEntries(
            Object.keys(keyedFilters).map(key => [key, array.filter(keyedFilters[key])]))},
    Objects = {
        ifNullThen: (object, defaultValue) => object !== null ? object : defaultValue,
        withField: (object, key, value) => {
            object[key] = value;
            return object;},
        withFields: (object, fieldKeyValues) => {
            Object.entries(fieldKeyValues).forEach(fieldKeyValue => object[fieldKeyValue[0]] = fieldKeyValue[1]);
            return object;}},
    Booleans = {
        flip: b => !b},
    Numbers = {
        range: (fromInclusive, toExclusive) => {
            let range = [];
            for(let i = fromInclusive; i < toExclusive; ++i) {
                range.push(i);}
            return range;},
        clampLower: (value, fromInclusive) => value < fromInclusive ? fromInclusive : value,
        clampUpper: (value, toInclusive) => value > toInclusive ? toInclusive : value,
        clamp: (value, fromInclusive, toInclusive) =>
            value < fromInclusive ? fromInclusive :
                value > toInclusive ? toInclusive :
                    value,
        randomIntegerInRange: (fromInclusive, toInclusive) =>
            Math.floor(Math.random() * (1 + toInclusive - fromInclusive) + fromInclusive)},
    Functions = {
        isFunction: x => typeof x === "function",
        noop: ()=>{},
        /**
         * Get the parameters names of function f
         */
        parameters: f => {
            const functionString = f.toString().replace(
                /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg,
                '');
            const result = functionString.slice(
                functionString.indexOf('(')+1,
                functionString.indexOf(')')).match(/([^\s,]+)/g);
            return result !== null ? result : [];},
        negate: predicate => (...args) => ! predicate(...args),
        /**
         *
         * @param comparator Accepts an index and returns a number less than, equal to, or greater than 0
         *  representing whether the search value is respectively to the left of, equal to, or right of the index.
         * @param length The length of the array to search through
         * @param guess A guess as to the index of the search value. If undefined, then will default to halfway.
         * @returns An object with two properties:
         *      found: true if the search value was found, otherwise false
         *      index: the closest matching index >= the search value
         */
        binarySearch: (comparator, length, guess=undefined) => {
            const innerSearch = (startIndex, length, offset=Math.ceil(length / 2) - 1) => {
                if(length === 0) return {found: false, index: 0};
                const index = startIndex + offset;
                const result = comparator(index);
                console.log(startIndex, length, offset, result);
                return result === 0 ? {found: true, index: index} :
                    length === 1 ? {found: result === 0, index: index + (result > 0 ? 1 : 0)} :
                    innerSearch(
                        result < 0 ? startIndex : index+1,
                        length % 2 === 0 && result > 0 ? offset+1 : offset);};
            return guess !== undefined ?
                innerSearch(0, length, guess) :
                innerSearch(0, length);}},
    Graph = {
        /**
         * Performs 'action' during a breadth-first traversal of a graph.
         * @param root The starting node of the traversal
         * @param neighbors A function that accepts a node and returns an array of its neighbors
         * @param action A function that accepts a node and does whatever.
         *               Defaults to 'do nothing', in which case this is simply a breadth-first search.
         *               The action is done before finding neighbors.
         * @return The visited nodes in their order of visitation
         */
        breadthFirst: (root, neighbors, action=Function.noop) => { //Performs 'action' in during breadth-first traversal
            const visited = [];
            const queue = [root];
            while(visited.length > 0) {
                const node = queue.shift();
                if(! visited.includes(node)) {
                    action(node);
                    visited.push(node);
                    queue.push(...neighbors(node));}}
            return visited;}},
    Maps = Module.of((
        Symbol = {
            INDEX_CONTEXT: 0,
            INDEX_KEY: 1,
            INDEX_VALUE: 2,
            LOCAL_STORAGE_KEY: "m-instances"},
        symbol2=Symbol=Objects.withFields(Symbol, {
            all: Module.of((
                symbolsString = localStorage.getItem(Symbol.LOCAL_STORAGE_KEY)
            )=>symbolsString === null ? [] : Symbol.symbolsFromString(symbolsString)),
            context: symbol => symbol[Symbol.INDEX_CONTEXT],
            key: symbol => symbol[Symbol.INDEX_KEY],
            value: symbol => symbol[Symbol.INDEX_VALUE],
            fromString: string => string.split(" "),
            symbolsFromString: string => string.trim().length === 0 ?
                [] :
                string.split("\n").map(Symbol.fromString),
            toString: symbol => symbol.join(" "),
            symbolsToString: symbols => symbols.map(Symbol.toString).join("\n")}),
        contextKeySearch = (context, key) => Functions.binarySearch(
            i=>{
                const x = Symbol.all[i];
                return context < Symbol.context(x) ? -1 :
                    context > Symbol.context(x) ? 1 :
                    key < Symbol.key(x) ? -1 :
                    key > Symbol.key(x) ? 1 : 0;},
            Symbol.all.length),
        contextBounds = context => {
            const lower = Functions.binarySearch(
                i=>{
                    const otherContext = Symbol.context(Symbol.all[i]);
                    return otherContext < context ? -1 :
                        otherContext > context ? 1 :
                            i === 0 ? 0 :
                                Symbol.context(Symbol.all[i-1]) === context ? -1 :
                                    0;},
                Symbol.all.length);
            return [
                lower,
                Functions.binarySearch(
                    i=>{
                        const otherContext = Symbol.context(Symbol.all[i]);
                        return otherContext < context ? -1 :
                            otherContext > context ? 1 :
                            i === Symbol.all.length - 1 ? 0 :
                            Symbol.context(Symbol.all[i+1]) === context ? 1 :
                            0;},
                    Symbol.all.length,
                    lower)];},
        contextSymbols = context => Symbol.all.slice(contextBounds(context))
    ) => ({
        save: () => localStorage.setItem(Symbol.LOCAL_STORAGE_KEY, Symbol.symbolsToString(Symbol.all)),
        size: map => {
            const bounds = contextBounds(map);
            return bounds[1] - bounds[0];},
        indexOf: (map, key) => {
            const search = contextKeySearch(map, key);
            return search.found === true ? search.index : -1;},
        get: (map, key) => {
            const search = contextKeySearch(map, key);
            return search.found === true ? Symbol.all[search.index].value : undefined;},
        keys: map => contextSymbols(map).map(Symbol.key),
        values: map => contextSymbols(map).map(Symbol.value),
        entries: map => contextSymbols(map).map(symbol=>[Symbol.key(symbol), Symbol.value(symbol)]),
        set: (map, key, value) => {
            const search = contextKeySearch(map, key);
            if(search.found === true) {
                Symbol.all[search.index].value = value;}
            else {
                Symbol.all.splice(search.index, 0, [map, key, value]);}},
        setAll: symbols => symbols.forEach(symbol => {
            const index = Maps.indexOf(Symbol.context(symbol), Symbol.key(symbol));
            if(index === -1) {
                Maps.set(...symbol);}}),
        /**
         * Set all of a's key-values onto b
         */
        setOnto: (a, b) => Maps.entries(a).forEach(entry=> Maps.set(b, ...entry)),
        unset: (map, key) => {
            const search = contextKeySearch(map, key);
            if(search.found === true) {
                Symbol.all.splice(search.index, 1);}},
        clear: map => {
            const bounds = contextBounds(map);
            Symbol.all.splice(bounds[0], bounds.length);},
        equals: (a, b) => Maps.entries(a) === Maps.entries(b)})),
    HTML = Module.of((
        Composition = {
            Collapsible: (head, content, isCollapsed=true) => {
                head.classList.add("head");
                content.classList.add("content");
                const collapsible = document.createElement("div");
                collapsible.dataset.isCollapsed = isCollapsed;
                collapsible.classList.add("collapsible");
                collapsible.onclick = e => Booleans.flip(e.target.parentElement.dataset.isCollapsed);
                collapsible.append(head, content);
                collapsible.append(content);
                return collapsible;},
            FunctionForm: f => {
                const functionContainer = document.createElement("div");
                const header = document.createElement("h1");
                header.innerHTML = f.name;
                const parameters = document.createElement("ul");
                parameters.append(...Functions.parameters(value).map(param => {
                    const parameter = document.createElement("li");
                    const label = document.createElement("label");
                    label.htmlFor = param;
                    label.textContent = param;
                    const input = document.createElement("input");
                    input.type = "text";
                    input.name = param;
                    parameter.append(label, input);
                    return parameter;}));
                const button = document.createElement("button");
                button.onclick = e => {
                    const form = e.target.parentElement;
                    form.parentElement.querySelector(".output").textContent =
                        Functions.parameters(f).map(param=>form.querySelector(`input[name='${param}']`).value)};
                button.textContent = "Call";
                const outputContainer = document.createElement("div");
                const outputLabel = document.createElement("span");
                outputLabel.textContent = "Output";
                outputContainer.append(outputLabel);
                const output = document.createElement("span");
                output.className = "output";
                outputContainer.append(output);
                functionContainer.append(header, parameters, button, outputContainer);
                return functionContainer;},
            InstanceView: undefined},
        composition2=Composition=Objects.withFields(Composition, {
            MapView: entries =>
                `<div class='mapView'>
                    <h1>Map</h1>
                    <ul class="symbols">${entries.map(entry=>
                        `<li class="symbol">
                            ${Composition.Collapsible(entry[0], Composition.InstanceView(entry[1]))}
                        </li>`)}
                    </ul>
                </div>`}),
        composition3=Composition=Objects.withFields(Composition, {
            InstanceView: instance => {
                if(Functions.isFunction(instance)) {
                    return Composition.FunctionForm(instance);}
                const entries = Maps.entries(instance);
                return entries.length === 0 ? instance : Composition.MapView(entries);}}),
        composition4=Composition=Objects.withFields(Composition, {
            InstanceManager: () => {
                const instanceManager = document.createElement("div");
                instanceManager.className = "instanceManager";
                const header = document.createElement("h1");
                header.textContent = "Instance Manager";

                const actionsContainer = document.createElement("div");
                const saveButton = document.createElement("button");
                saveButton.onclick = Maps.save();
                saveButton.textContent = "Save";
                const importButton = document.createElement("button");
                importButton.onclick = () => HTML.Helper.uploadFile(
                    fileContents => Maps.setAll(Object.values(fileContents)
                        .map(fileContent => Symbol.symbolsFromString(fileContent))),
                    ".txt",
                    true);
                importButton.textContent = "Import";
                const downloadButton = document.createElement("button");
                downloadButton.onclick = () => HTML.Helper.downloadText("symbols.txt", Symbol.symbolsToString(Maps.all));
                downloadButton.textContent = "Download";
                actionsContainer.append(saveButton, importButton, downloadButton);

                const searchContainer = document.createElement("div");
                const searchInput = document.createElement("input");
                searchInput.className = "search";
                searchInput.type = "text";
                searchInput.placeholder = "Search for an instance";
                const searchButton = document.createElement("button");
                searchButton.textContent = "Go";
                searchButton.onclick = () => {
                    const input = searchInput.value;
                    return undefined; }; //TODO
                searchContainer.append(searchInput, searchButton);

                const instanceContainer = document.createElement("div");
                instanceContainer.className = "instanceContainer";

                instanceManager.append(header, actionsContainer, searchContainer, instanceContainer);
                return instanceManager;}})
    ) => ({
        Composition: Composition,
        Helper: {
            clickTempElement: element => {
                element.style.display = "none";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);},
            downloadText: (filename, content) => {
                //Convert the shapes to a text string and open in a new tab
                const tempLink = document.createElement('a');
                tempLink.setAttribute(
                    'href',
                    'data:text/plain;charset=utf-8,' +
                    encodeURIComponent(content));
                tempLink.setAttribute('download', filename);
                HTML.Helper.clickTempElement(tempLink);},
            /**
             *
             * @param callback If acceptMultiple === false, then this is passed the string content of the chosen file;
             *  otherwise, it returns an object whose keys are the filenames and values their string contents.
             * @param mimeType
             * @param acceptMultiple
             */
            uploadFile: (callback, mimeType="txt", acceptMultiple=false) => {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = `.${mimeType}`;
                fileInput.multiple = acceptMultiple;
                const fileReader = new FileReader();
                fileInput.onchange = acceptMultiple === false ?
                    () => {
                        fileReader.onloadend = e=> callback(e.target.result);
                        fileReader.readAsText(fileInput.files[0]);} :
                    () => {
                        const files = fileInput.files;
                        let numLoaded = 0;
                        const fileContents = {};
                        const readNext=()=>{
                            fileReader.onloadend = e => {
                                files[files[numLoaded].name] = e.target.result;
                                if(++numLoaded===files.length) {
                                    callback(fileContents); }
                                else {
                                    readNext();}};
                            fileReader.readAsText(files[numLoaded]);};
                        readNext();};
                HTML.Helper.clickTempElement(fileInput);}}}))
) => ({
    Module: Module,
    Array: Arrays,
    Function: Functions,
    Object: Objects,
    Map: Maps,
    HTML: HTML}))();