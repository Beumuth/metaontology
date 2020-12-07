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
            elementsFromString: elementsString=>{
                elementsString = elementsString.split("\n");
                if(elementsString.length === 0) {
                    return {};}
                const elements = {};
                elementsString.forEach(elementString => {
                    const element = elementString.split(" ").map(
                        (elementComponent, i) => i <=2 ?
                            Number.parseInt(elementComponent) :
                            elementComponent === "" ? null : elementComponent);
                    elements[element[0]] = element.slice(1);});
                return elements;},
            elementsToString: elements => Object.entries(elements)
                .map(entry=>`${entry[0]} ${entry[1][0]} ${entry[1][1]} ${entry[1][2] ?? ""}`)
                .join("\n")},
        element2=Element=Objects.withFields(Element,{
            loadFromLocalStorage: () => {
                const elementsString = localStorage.getItem(Element.localStorageKey);
                return elementsString === null ? {} : Element.elementsFromString(elementsString);}}),
        element3=Element=Objects.withFields(Element,{
            all: Element.loadFromLocalStorage()}),
        element4=Element=Objects.withFields(Element,{
            ids: () => Object.keys(Element.all).map(id => Number.parseFloat(id)),
            saveToLocalStorage: () => localStorage.setItem(
                Element.localStorageKey,
                Element.elementsToString(Element.all)),
            nextId: Module.of(() => {
                const ids = Object.keys(Element.all);
                return ids.length === 0 ? 1 : 1+Number.parseInt(ids[ids.length - 1]);})}),
        element5=Element=Objects.withFields(Element, {
            exists: id => undefined !== Element.all[id],
            existsWithAOrB: (a, b) => Object.values(Element.all).some(element => element[0] === a || element[1] === b),
            existsWithAAndB: (a, b) => Object.values(Element.all).some(element => element[0] === a && element[1] === b),
            isNode: id => {
                const element = Element.all[id];
                return element[0] === id && element[1] === id},
            isPendantFrom: (id, idFrom) => {
                const element = Element.all[id];
                return element[0] === idFrom && element[1] === id;},
            isPendantTo: (id, idTo) => {
                const element = Element.all[id];
                return element[0] === id && element[1] === idTo;},
            isLoopOn: (id, idOn) => {
                const element = Element.all[id];
                return element[0] === idOn && element[1] === idOn;},
            isEdge: id => ! Element.all[id].includes(id),
            hasA: (id, a) => Element.all[id][0] === a,
            hasB: (id, b) => Element.all[id][1] === b,
            hasAOrB: (id, a, b) => {
                const element = Element.all[id];
                return element[0] === a || element[1] === b;},
            hasAAndB: (id, a, b) => {
                const element = Element.all[id];
                return element[0] === a && element[1] === b;},
            isEndpoint: id => Object.entries(Element.all)
                .some(entry => id !== entry[0] && entry[1][0] === id || entry[1][1] === id),
            areConnected: (idA, idB) => {
                const elementA = Element.all[idA];
                const elementB = Element.all[idB];
                return elementA[0] === idB || elementA[1] === idB || elementB[0] === idA || elementB[1] === idA;},
            numWithA: a => Arrays.count(Element.ids(), id=>Element.hasA(id, a)),
            numWithB: b => Arrays.count(Element.ids(), id=>Element.hasB(id, b)),
            numWithAorB: (a, b) => Arrays.count(Element.ids(), id => Element.hasAOrB(id, a, b)),
            numNodes: () => Arrays.count(Element.ids(), Element.isNode),
            numPendantsFrom: idFrom => Arrays.count(Element.ids(), id => Element.isPendantFrom(id, idFrom)),
            numPendantsTo: idTo => Arrays.count(Element.ids(), id => Element.isPendantTo(id, idTo)),
            numLoopsOn: idOn => Arrays.count(Element.ids(), id=>Element.isLoopOn(id, idOn)),
            numConnectedFrom: id => Arrays.count(Element.ids(), idOther => id !== idOther && Element.hasA(idOther, id)),
            numConnectedTo: id => Arrays.count(Element.ids(), idOther => id !== idOther && Element.hasB(idOther, id)),
            get: id => [id].concat(Element.all[id]),
            withA: a => Element.ids().filter(id => Element.hasA(id, a)),
            withB: b => Element.ids().filter(id => Element.hasB(id, b)),
            withAOrB: (a, b) => Element.ids().filter(id => Element.hasAOrB(id, a, b)),
            withAAndB: (a, b) => Element.ids().filter(id => Element.hasAAndB(id, a, b)),
            nodes: () => Element.ids().filter(Element.isNode),
            pendantsFrom: idFrom => Element.ids().filter(id => Element.isPendantFrom(id, idFrom)),
            pendantsTo: idTo => Element.ids().filter(id => Element.isPendantTo(id, idTo)),
            loopsOn: idOn => Element.ids().filter(id => Element.isLoopOn(id, idOn)),
            connected: id => Element.ids().filter(idOther => id !== idOther && Element.hasAOrB(idOther, id)),
            connectedFrom: id => Element.ids().filter(idOther => id !== idOther && Element.hasA(idOther, id)),
            connectedTo: id => Element.ids().filter(idOther => id !== idOther && Element.hasB(idOther, id)),
            create: (id, a, b, name=null) => {
                Element.all[id] = [a, b, name];
                if(id >= Element.nextId) {
                    Element.nextId = id + 1;}},
            createAutoId: (a, b) => {
                Element.all[Element.nextId] = [a, b];
                return Element.nextId++;},
            update: (id, a, b) => Element.all[id] = [a, b],
            delete: id => delete Element.all[id]}),
        element6=Element=Objects.withFields(Element, {
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
            updateAll: elements => elements.forEach(element => Element.update(...element)),
            deleteAll: ids => ids.forEach(Element.delete)}),
        element7=Element=Objects.withFields(Element, {
            numConnected: id => Element.connectedTo(id).length,
            createAutoNodes: n => Numbers.range(0, n).map(Element.createAutoNode),
            createAutoPendantsFrom: (idFrom, n) => Numbers.range(0, n).map(() => Element.createAutoPendantFrom(idFrom)),
            createAutoPendantsTo: (idTo, n) => Numbers.range(0, n).map(() => Element.createAutoPendantTo(idTo)),
            createAutoLoopsOn: (idOn, n) => Numbers.range(0, n).map(() => Element.createAutoLoopOn(idOn)),
            fullDelete: id => Element.deleteAll([id].concat(Element.connectedTo(id)))}),
        element8=Element=Objects.withFields(Element, {
            isDetached: id => Element.numConnected(id) === 0}),
        element9=Element=Objects.withFields(Element, {
            safeDelete: id => {
                if(! Element.isDetached(id)) {
                    return false;}
                Element.delete(id);
                return true;}}),
        element10=Element=Objects.withFields(Element, {
            safeDeleteAll: ids => ids.map(Element.safeDelete)})
    ) => Element),
    Instance=Module.of((
        Instance={
            root: Element.createAutoNode,
            tag: instance => Element.createAutoPendantFrom(instance),
            tagWith: (instance, tag) => Element.createAutoId(instance, tag),
            getAllTags: instance => Element.connectedFrom(instance),
            getAllParents: Module.of((next= i=>Element.all[i][0]) => instance => {
                if(! Element.exists(instance)) {
                    return [];}
                const parents = [];
                let curParent = next(instance);
                while(! (curParent === instance || parents.includes(curParent))) {
                    parents.push(curParent);
                    curParent = next(curParent);}
                return parents;}),
            isUnreferenced: Element.isDetached,
            delete: Element.delete,
            nameOf: id => {
                const element = Element.all[id];
                return element.length < 3 ? `${id}` : element[2] ?? `${id}`;},
            rename: (id, name) => Element.all[id][2] = name}
    ) => Instance)
) => ({
    Module: Module,
    Element: Element,
    Instance: Instance
}))();