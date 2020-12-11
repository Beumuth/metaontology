let M = ((
    Module = {of: (f, ...args) => f.apply(undefined, args)},
    Arrays = {
        count: (array, predicate) => array.reduce((count, element) => predicate(element) ? count + 1 : count, 0),
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
        negate: predicate => (...args) => ! predicate(...args)},
    Element = Module.of((
        Element={
            localStorageKey: "metaontology-elements",
            elementsFromString: elementsString => elementsString.trim().length > 0 ?
                elementsString.split("\n").map(elementString => elementString
                    .split(" ")
                    .map((elementComponent, i) => i <=2 ?
                        Number.parseInt(elementComponent) :
                        elementComponent === "" ? null : elementComponent)) :
                [],
            elementsToString: elements => elements.map(element=>element.join(' ')).join("\n")},
        element2=Element=Objects.withFields(Element,{
            loadFromLocalStorage: () => {
                const elementsString = localStorage.getItem(Element.localStorageKey);
                return elementsString === null ? {} : Element.elementsFromString(elementsString);}}),
        element3=Element=Objects.withFields(Element,{
            all: Element.loadFromLocalStorage()}),
        element4=Element=Objects.withFields(Element,{
            saveToLocalStorage: () => localStorage.setItem(
                Element.localStorageKey,
                Element.elementsToString(Element.all)),
            nextId: Element.all.length > 0 ? 1+Element.all[Element.all.length - 1][0] : 1}),
        ElementArray={ //This is not externally exposed, does functions over full element rather than just id
            id: element => element[0],
            a: element => element[1],
            b: element => element[2]},
        elementArray2=ElementArray=Objects.withFields(ElementArray,{
            equals: (a, b) => a[0] === b[0],
            name: element => element[3] ?? `${ElementArray.id(element)}`,
            hasId: (element, id) => ElementArray.id(element) === id,
            hasA: (element, a) => ElementArray.a(element) === a,
            hasB: (element, b) => ElementArray.b(element) === b}),
        elementArray3=ElementArray=Objects.withFields(ElementArray, {
            hasAOrB: (element, a, b) => ElementArray.hasA(element, a) || ElementArray.hasB(element, b),
            hasAAndB: (element, a, b) => ElementArray.hasA(element, a) && ElementArray.hasB(element, b)}),
        elementArray4=ElementArray=Objects.withFields(ElementArray, {
            idsOf: elements => elements.map(element => element[0]),
            isNode: element =>
                ElementArray.hasA(element, ElementArray.id(element)) &&
                ElementArray.hasB(element, ElementArray.id(element)),
            isPendantFrom: (element, idFrom) =>
                ElementArray.hasA(element, idFrom) &&
                ElementArray.hasB(element, ElementArray.id(element)),
            isPendantTo: (element, idTo) =>
                ElementArray.hasA(element, ElementArray.id(element)) &&
                ElementArray.hasB(element, idTo),
            isLoopOn: (element, idOn) =>
                ! ElementArray.hasId(element, idOn) &&
                ElementArray.hasAAndB(element, idOn),
            isEdge: element => ! (
                ElementArray.hasId(element, ElementArray.a(element)) ||
                ElementArray.hasId(element, ElementArray.b(element)) ||
                ElementArray.a(element) === ElementArray.b(element)),
            isEndpoint: element => Element.some(other =>
                ElementArray.hasAOrB(other, ElementArray.id(element), ElementArray.id(element)) &&
                ! ElementArray.equals(element, other)),
            areConnected: (a, b) => ElementArray.hasAOrB(b, a[0], a[0]) || ElementArray.hasAOrB(a, b[0], b[0])}),
        element5=Element=Objects.withFields(Element, {
            ids: () => Element.all.map(ElementArray.id),
            indexOf: id => Element.all.findIndex(element => ElementArray.id(element) === id),
            get: id => Element.all.find(element => ElementArray.id(element) === id),}),
        element6=Element=Objects.withFields(Element, {
            a: id => ElementArray.a(Element.get(id)),
            b: id => ElementArray.b(Element.get(id)),
            exists: id => undefined !== Element.get(id),
            existsWithAOrB: (a, b) => Element.all.some(element => ElementArray.hasAOrB(element, a, b)),
            existsWithAAndB: (a, b) => Element.all.some(element => ElementArray.hasAAndB(element, a, b)),
            isNode: id => ElementArray.isNode(Element.get(id)),
            isPendantFrom: (id, idFrom) => ElementArray.isPendantFrom(Element.get(id), idFrom),
            isPendantTo: (id, idTo) => ElementArray.isPendantTo(Element.get(id), idTo),
            isLoopOn: (id, idOn) => ElementArray.isLoopOn(Element.get(id), idOn),
            isEdge: id => ElementArray.isEdge(Element.get(id)),
            hasA: (id, a) => ElementArray.hasA(Element.get(id), a),
            hasB: (id, b) => ElementArray.hasB(Element.get(id), b),
            hasAOrB: (id, a, b) => ElementArray.hasAOrB(Element.get(id), a, b),
            hasAAndB: (id, a, b) => ElementArray.hasAAndB(Element.get(id), a, b),
            isEndpoint: id => ElementArray.isEndpoint(Element.get(id)),
            areConnected: (idA, idB) => ElementArray.areConnected(Element.get(idA), Element.get(idB)),
            numWithA: a => Arrays.count(Element.all, element=>ElementArray.hasA(element, a)),
            numWithB: b => Arrays.count(Element.all, element=>ElementArray.hasB(element, b)),
            numWithAorB: (a, b) => Arrays.count(Element.all, element => ElementArray.hasAOrB(element, a, b)),
            numNodes: () => Arrays.count(Element.all, ElementArray.isNode),
            numPendantsFrom: idFrom => Arrays.count(Element.all, element =>
                ElementArray.isPendantFrom(element, idFrom)),
            numPendantsTo: idTo => Arrays.count(Element.all, element=>ElementArray.isPendantTo(element, idTo)),
            numLoopsOn: idOn => Arrays.count(Element.all, element=>ElementArray.isLoopOn(element, idOn)),
            numConnectedFrom: id => Arrays.count(Element.all, otherElement =>
                ElementArray.id(otherElement) !== id &&
                ElementArray.hasA(otherElement, id)),
            numConnectedTo: id => Arrays.count(Element.all, otherElement =>
                ElementArray.id(otherElement) !== id &&
                ElementArray.hasB(otherElement, id)),
            create: (id, a, b, name=null) => {
                Element.all.push([id, a, b, name]);
                if(id >= Element.nextId) {
                    Element.nextId = id + 1;}},
            createAutoId: (a, b, name=null) => {
                Element.all.push([Element.nextId, a, b, name]);
                return Element.nextId++;},
            update: (id, a, b) => {
                const index = Element.indexOf(id);
                Element.all[index][1] = a;
                Element.all[index][2] = b;},
            delete: id => Element.all.splice(Element.indexOf(id), 1)}),
        element7=Element=Objects.withFields(Element, {
            withA: a => Element.ids().filter(id => Element.hasA(id, a)),
            withB: b => Element.ids().filter(id => Element.hasB(id, b)),
            withAOrB: (a, b) => Element.ids().filter(id => Element.hasAOrB(id, a, b)),
            withAAndB: (a, b) => Element.ids().filter(element => Element.hasAAndB(element, a, b)),
            nodes: () => Element.ids().filter(Element.isNode),
            pendantsFrom: idFrom => Element.ids().filter(id => Element.isPendantFrom(id, idFrom)),
            pendantsTo: idTo => Element.ids().filter(id => Element.isPendantTo(id, idTo)),
            loopsOn: idOn => Element.ids().filter(id => Element.isLoopOn(id, idOn)),
            connected: id => Element.ids().filter(idOther => id !== idOther && Element.hasAOrB(idOther, id)),
            connectedFrom: id => Element.ids().filter(idOther => id !== idOther && Element.hasA(idOther, id)),
            connectedTo: id => Element.ids().filter(idOther => id !== idOther && Element.hasB(idOther, id)),
            anyExist: ids => ids.some(Element.exists),
            allExist: ids => ids.every(Element.exists),
            haveA: (ids, a) => ids.map(id => Element.hasA(id, a)),
            haveB: (ids, b) => ids.map(id => Element.hasB(id, b)),
            areNodes: ids => ids.map(Element.isNode),
            arePendantsFrom: (ids, idFrom) => ids.map(id => Element.isPendantFrom(id, idFrom)),
            arePendantsTo: (ids, idTo) => ids.map(id => Element.isPendantTo(id, idTo)),
            areLoopsOn: (ids, idOn) => ids.map(id => Element.isLoopOn(id, idOn)),
            areEdges: (ids) => ids.map(Element.isEdge),
            areEndpoints: ids => ids.map(Element.isEndpoint),
            allConnectedFromSelf: () => Element.ids().filter(id =>Element.hasA(id, id)),
            allConnectedToSelf: () => Element.ids().filter(id=>Element.hasB(id, id)),
            allNodes: () => Element.ids().filter(Element.isNode),
            createMultiple: elements => elements.forEach(element => Element.create(element[0], element[1], element[2])),
            createMultipleAutoId: elements => elements.map(element => Element.createAutoId(element[0], element[1])),
            createNode: id => Element.create(id, id, id),
            createAutoNode: () => {
                const id = Element.nextId;
                Element.create(id, id, id);
                return id;},
            createPendantFrom: (id, idFrom) => Element.create(id, idFrom, id),
            createAutoPendantFrom: idFrom => {
                const id = Element.nextId;
                Element.create(id, idFrom, id);
                return id;},
            createPendantTo: (id, idTo) => Element.create(id, id, idTo),
            createAutoPendantTo: idTo => {
                const id = Element.nextId;
                Element.create(id, id, idTo);
                return id;},
            createLoopOn: (id, idOn) => Element.create(id, idOn, idOn),
            createAutoLoopOn: idOn => Element.createAutoId(idOn, idOn),
            createAutoEdge: (idFrom, idTo) => Element.createAutoId(idFrom, idTo),
            updateAll: elements => elements.forEach(element => Element.update(...element)),
            deleteAll: ids => ids.forEach(Element.delete)}),
        element8=Element=Objects.withFields(Element, {
            numConnected: id => Element.connectedTo(id).length,
            createAutoNodes: n => Numbers.range(0, n).map(Element.createAutoNode),
            createAutoPendantsFrom: (idFrom, n) => Numbers.range(0, n).map(() => Element.createAutoPendantFrom(idFrom)),
            createAutoPendantsTo: (idTo, n) => Numbers.range(0, n).map(() => Element.createAutoPendantTo(idTo)),
            createAutoLoopsOn: (idOn, n) => Numbers.range(0, n).map(() => Element.createAutoLoopOn(idOn)),
            fullDelete: id => Element.deleteAll([id].concat(Element.connectedTo(id)))}),
        element9=Element=Objects.withFields(Element, {
            isDetached: id => Element.numConnected(id) === 0}),
        element10=Element=Objects.withFields(Element, {
            safeDelete: id => {
                if(! Element.isDetached(id)) {
                    return false;}
                Element.delete(id);
                return true;}}),
        element11=Element=Objects.withFields(Element, {
            safeDeleteAll: ids => ids.map(Element.safeDelete)})
    ) => Element),
    Instance=Module.of((
        Instance={
            new: Element.createAutoNode,
            nameOf: id => {
                const element = Element.get(id);
                return element.length < 4 ? `${id}` : element[3] ?? `${id}`;},
            getAllTags: id => Element.connectedFrom(id),},
        instance2=Objects.withFields(Instance, {
            tagWith: (instance, tag) => Element.createAutoId(instance, tag),
            getAllTagsWithName: (instance, name) => Instance
                .getAllTags(instance)
                .filter(tag => Instance.nameOf(tag) === name),
            firstMatchingTag: (instance, predicate) => {
                //Order: instance's tags, instance's parents' tags,
                const tags = instance.getAllTags(instance);
                tags.find(predicate) ?? tags.find(tag => Instance.firstMatchingTag())
                return undefined;},
            allParents: Module.of((next= i=>Element.a(i)) => instance => {
                if(! Element.exists(instance)) {
                    return [];}
                const parents = [];
                let curParent = next(instance);
                while(! (curParent === instance || parents.includes(curParent))) {
                    parents.push(curParent);
                    curParent = next(curParent);}
                return parents;}),
            isUnreferenced: Element.isDetached,
            withName: name => Element.ids().filter(id => Instance.nameOf(id) === name),
            rename: (id, name) => Element.all[Element.indexOf(id)][3] = name,
            delete: Element.delete,
            hasReference: (instance, name) => Instance
                .getAllTagsWithName(instance, "Reference")
                .some(reference => Instance.nameOf(reference) === name),
            valueOf: (instance, referenceName) => {

            },
            toHTML: instance => {
                const parents = Instance.allParents(instance);
                return `<div class='instance' data-id='${instance}' class='instance'>
                    <span
                        class="instanceHeader"
                        onclick="Controller.toggleInstanceDetails(event.currentTarget.parentElement);"
                     >
                        <span class="instanceDetailsExpander">+</span>
                        <span class="instanceName">${M.Instance.nameOf(instance)}</span>
                    </span>
                    <div class="instanceDetails">
                        <div class="instanceLineageContainer">
                            <span class="instanceLineageHeader">Lineage:</span>
                            <ol class='instanceLineage'>
                                ${[instance]
                                    .concat(parents)
                                    .map(ancestor => `<li class='instanceAncestor'>${ancestor}</li>`)
                                    .join("")}
                            </ol>
                        </div>
                        <div class="instanceControls">
                            <div class="renameContainer">
                                <input type="text" class="instanceName">
                                <button
                                    class="renameInstanceButton"
                                    onclick="Controller.renameInstance(
                                        ${instance},
                                        event.currentTarget.parentElement.querySelector('.instanceName'))"
                                >
                                    Rename
                                </button>
                            </div>
                            <div class="addTagContainer">
                                <input type="number" class="tagTo">
                                <button
                                    class="tagButton"
                                    onclick="Controller.tagOnClick(
                                        ${instance},
                                        event.currentTarget.parentElement.querySelector('.tagTo'))">
                                    Tag
                                </button>
                            </div>
                            <div class="deleteButtonContainer">
                                <button class="deleteInstanceButton" onclick="Controller.deleteOnClick(${instance})">
                                    Delete
                                </button>
                            </div>
                        </div>
                        <ul class="instances tags">
                            ${Instance.getAllTags(instance).map(tag=>
                                `<li class='tag'>${Instance.toHTML(tag).join("")}</li>`)}
                        </ul>
                    </div>
                </div>`;},
            Reference: {
                create: (context, key, value) => {
                    const reference = Instance.new();

                    return reference;}}
        }),
    ) => Instance)
) => ({
    Module: Module,
    Element: Element,
    Instance: Instance
}))();