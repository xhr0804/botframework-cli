const antlr4 = require('antlr4');
const LUFileLexer = require('./generated/LUFileLexer').LUFileLexer;
const LUFileParser = require('./generated/LUFileParser').LUFileParser;
const FileContext = require('./generated/LUFileParser').LUFileParser.FileContext;
const LUResource = require('./luResource');
const NestedIntentSection = require('./nestedIntentSection');
const SimpleIntentSection = require('./simpleIntentSection');
const EntitySection = require('./entitySection');
const NewEntitySection =  require('./newEntitySection');
const ImportSection = require('./importSection');
const QnaSection = require('./qnaSection');
const ModelInfoSection = require('./modelInfoSection');
const LUErrorListener = require('./luErrorListener');
const SectionType = require('./../utils/enums/lusectiontypes');
const DiagnosticSeverity = require('./diagnostic').DiagnosticSeverity;
const BuildDiagnostic = require('./diagnostic').BuildDiagnostic;
const NEWLINE = require('os').EOL;

class LUParser {
    /**
     * @param {string} text
     */
    static parse(text) {
        if (text === undefined || text === '') {
            return new LUResource([], '', []);
        }

        let sections = [];
        let content = text;

        let {fileContent, errors} = this.getFileContent(text);

        try {
            let modelInfoSections = this.extractModelInfoSections(fileContent);
            modelInfoSections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(modelInfoSections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing model information: ${err.message}`
            }))
        }

        try {
            let isSectionEnabled = this.isSectionEnabled(sections);

            let nestedIntentSections = this.extractNestedIntentSections(fileContent, content);
            nestedIntentSections.forEach(section => errors = errors.concat(section.Errors));
            if (isSectionEnabled) {
                sections = sections.concat(nestedIntentSections);
            } else {
                nestedIntentSections.forEach(section => {
                    let emptyIntentSection = new SimpleIntentSection();
                    emptyIntentSection.ParseTree = section.ParseTree.nestedIntentNameLine();
                    emptyIntentSection.Name = section.Name;
                    let errorMsg = `no utterances found for intent definition: "# ${emptyIntentSection.Name}"`
                    let error = BuildDiagnostic({
                        message: errorMsg,
                        context: emptyIntentSection.ParseTree,
                        severity: DiagnosticSeverity.WARN
                    })

                    errors.push(error);
                    sections.push(emptyIntentSection);

                    section.SimpleIntentSections.forEach(subSection => {
                        sections.push(subSection);
                        errors = errors.concat(subSection.Errors);
                    })
                });
            }
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing nested intent section: ${err.message}`
            }))
        }

        try {
            let simpleIntentSections = this.extractSimpleIntentSections(fileContent, content);
            simpleIntentSections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(simpleIntentSections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing simple intent section: ${err.message}`
            }))
        }

        try {
            let entitySections = this.extractEntitiesSections(fileContent);
            entitySections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(entitySections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing entities: ${err.message}`
            }))
        }

        try {
            let newEntitySections = this.extractNewEntitiesSections(fileContent);
            newEntitySections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(newEntitySections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing new entities: ${err.message}`
            }))
        }

        try {
            let importSections = this.extractImportSections(fileContent);
            importSections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(importSections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing import section: ${err.message}`
            }))
        }

        try {
            let qnaSections = this.extractQnaSections(fileContent);
            qnaSections.forEach(section => errors = errors.concat(section.Errors));
            sections = sections.concat(qnaSections);
        } catch (err) {
            errors.push(BuildDiagnostic({
                message: `Error happened when parsing qna section: ${err.message}`
            }))
        }

        this.extractSectionBody(sections, content)

        return new LUResource(sections, content, errors);
    }

    /**
     * @param {string} text
     */
    static getFileContent(text) {
        if (text === undefined
            || text === ''
            || text === null) {
            
            return undefined;
        }

        const chars = new antlr4.InputStream(text);
        const lexer = new LUFileLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        const parser = new LUFileParser(tokens);
        let errors = [];
        const listener = new LUErrorListener(errors)
        parser.removeErrorListeners();
        parser.addErrorListener(listener);
        parser.buildParseTrees = true;
        const fileContent = parser.file();
        
        return { fileContent, errors };
    }

    /**
     * @param {FileContext} fileContext
     * @param {string} content 
     */
    static extractNestedIntentSections(fileContext, content) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let nestedIntentSections = fileContext.paragraph()
            .map(x => x.nestedIntentSection())
            .filter(x => x !== undefined && x !== null);

        let nestedIntentSectionList = nestedIntentSections.map(x => new NestedIntentSection(x, content));

        return nestedIntentSectionList;
    }

    /**
     * @param {FileContext} fileContext 
     * @param {string} content 
     */
    static extractSimpleIntentSections(fileContext, content) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let simpleIntentSections = fileContext.paragraph()
            .map(x => x.simpleIntentSection())
            .filter(x => x && x.intentDefinition());

        let simpleIntentSectionList = simpleIntentSections.map(x => new SimpleIntentSection(x, content));

        return simpleIntentSectionList;
    }

    /**
     * @param {FileContext} fileContext 
     */
    static extractEntitiesSections(fileContext) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let entitySections = fileContext.paragraph()
            .map(x => x.simpleIntentSection())
            .filter(x => x && !x.intentDefinition());

        let entitySectionList = [];
        entitySections.forEach(x => {
            if (x.entitySection) {
                for (const entitySection of x.entitySection()) {
                    entitySectionList.push(new EntitySection(entitySection));
                }
            }
        })

        return entitySectionList;
    }

    /**
     * @param {FileContext} fileContext 
     */
    static extractNewEntitiesSections(fileContext) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let newEntitySections = fileContext.paragraph()
            .map(x => x.simpleIntentSection())
            .filter(x => x && !x.intentDefinition());
        
        let newEntitySectionList = [];
        newEntitySections.forEach(x => {
            if (x.newEntitySection) {
                for (const newEntitySection of x.newEntitySection()) {
                    newEntitySectionList.push(new NewEntitySection(newEntitySection));
                }
            }
        })

        return newEntitySectionList;
    }

    /**
     * @param {FileContext} fileContext 
     */
    static extractImportSections(fileContext) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let importSections = fileContext.paragraph()
            .map(x => x.importSection())
            .filter(x => x !== undefined && x !== null);

        let importSectionList = importSections.map(x => new ImportSection(x));

        return importSectionList;
    }

    /**
     * @param {FileContext} fileContext 
     */
    static extractQnaSections(fileContext) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let qnaSections = fileContext.paragraph()
            .map(x => x.qnaSection())
            .filter(x => x !== undefined && x !== null);

        let qnaSectionList = qnaSections.map(x => new QnaSection(x));

        return qnaSectionList;
    }

    /**
     * @param {FileContext} fileContext 
     */
    static extractModelInfoSections(fileContext) {
        if (fileContext === undefined
            || fileContext === null) {
                return [];
        }

        let modelInfoSections = fileContext.paragraph()
            .map(x => x.modelInfoSection())
            .filter(x => x !== undefined && x !== null);

        let modelInfoSectionList = modelInfoSections.map(x => new ModelInfoSection(x));

        return modelInfoSectionList;
    }

    /**
     * @param {any[]} sections
     * @param {string} content
     */
    static extractSectionBody(sections, content) {
        sections.sort((a, b) => a.ParseTree.start.line - b.ParseTree.start.line)
        const originList = content.split(/\r?\n/)
        let qnaSectionIndex = 0
        sections.forEach(function (section, index) {
            if (section.SectionType === SectionType.SIMPLEINTENTSECTION
                || section.SectionType === SectionType.NESTEDINTENTSECTION
                || section.SectionType === SectionType.QNASECTION) {
                const startLine = section.ParseTree.start.line - 1
                let stopLine
                if (index + 1 < sections.length) {
                    stopLine = sections[index + 1].ParseTree.start.line - 1
                    if (isNaN(startLine) || isNaN(stopLine) || startLine < 0 || startLine >= stopLine || originList.Length <= stopLine) {
                        throw new Error("index out of range.")
                    }
                } else {
                    stopLine = originList.length
                }

                let destList
                if (section.SectionType === SectionType.QNASECTION) {
                    destList = originList.slice(startLine, stopLine)
                    section.Id = qnaSectionIndex
                    qnaSectionIndex++
                } else {
                    destList = originList.slice(startLine + 1, stopLine)
                }

                section.Body = destList.join(NEWLINE)
                section.StartLine = startLine
                section.StopLine = stopLine - 1

                if (section.SectionType === SectionType.NESTEDINTENTSECTION) {
                    LUParser.extractSectionBody(section.SimpleIntentSections, originList.slice(0, stopLine).join(NEWLINE))
                }
            } else {
                section.StartLine = section.ParseTree.start.line
                section.StopLine = section.ParseTree.stop.line - 1
            }
        })
    }

    static isSectionEnabled(sections) {
        let modelInfoSections = sections.filter(s => s.SectionType === SectionType.MODELINFOSECTION);
        let enableSections = false;
        if (modelInfoSections && modelInfoSections.length > 0) {
            for (const modelInfo of modelInfoSections) {
                let line = modelInfo.ModelInfo
                let kvPair = line.split(/@(enableSections).(.*)=/g).map(item => item.trim());
                if (kvPair.length === 4) {
                    if (kvPair[1] === 'enableSections' && kvPair[3] === 'true') {
                        enableSections = true;
                        break;
                    }
                }
            }
        }

        return enableSections;
    }
}

module.exports = LUParser;