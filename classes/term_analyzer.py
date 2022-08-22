# -*- coding:utf-8 -*-
import json
from typing import Any, List, Dict, TypedDict
import kss
from konlpy.tag import Kkma
import urllib3

kkma = Kkma()


class UtteranceObject(TypedDict):
    name: str
    utterance: str
    sentenceObjects: List


class Morp(TypedDict):
    id: float  # 0
    lemma: str  # "양쪽"
    position: float  # 143
    type: str  # "NNG"
    weight: float  # 0.0507141


class Word(TypedDict):
    begin: float  # 0
    end: float  # 1
    id: float  # 0
    text: str  # "양쪽이"
    type: str  # ""


class SentenceObjectOfAiopen(TypedDict):
    morp: List[Morp]
    word: List[Word]


def check_noun_condition(term_type: str) -> bool:
    return term_type == 'NNG' or term_type == 'NNP'


def check_term_condition(term: str, stopword_dict: dict) -> bool:
    if len(term) > 1 and term not in stopword_dict:
        return True
    else:
        return False


class TermAnalyzer:
    def __init__(self, utterance_objects: List[UtteranceObject],
                 stopword_dict: dict,
                 aiopen_access_key: str,
                 standard_high_frequency: int):

        # split only_utterances_text to sentences
        # sentences = kss.split_sentences(only_utterances_text)
        # sentences = kkma.sentences(only_utterances_text)

        # join sentences until 10000 chars. => several texts
        unit_texts = self.__split_unit_texts(utterance_objects, 10000)
        # print(unit_texts)

        # get morp and word
        self.__sentence_objects_of_aiopen = self.__analyze_aiopen_nlu(
            unit_texts, aiopen_access_key)

        # make single_term
        single_term_frequency_dict = self.__make_singleterm_frequency_dict(
            self.__sentence_objects_of_aiopen, stopword_dict)
        self.__single_term_list = list(single_term_frequency_dict.keys())
        self.__single_term_list.sort()
        self.__single_keyterm_objects = self.__make_keyterm_objects(
            single_term_frequency_dict, self.__single_term_list, standard_high_frequency)
        self.__single_frequency_vector = self.__make_frequency_vector(
            self.__single_term_list, single_term_frequency_dict)

        # make compound_term
        compound_term_frequency_dict = self.__make_compoundterm_frequency_dict(
            self.__sentence_objects_of_aiopen, stopword_dict)
        self.__compound_term_list = list(compound_term_frequency_dict.keys())
        self.__compound_term_list.sort()
        self.__compound_keyterm_objects = self.__make_keyterm_objects(
            compound_term_frequency_dict, self.__compound_term_list, standard_high_frequency)
        self.__compound_frequency_vector = self.__make_frequency_vector(
            self.__compound_term_list, compound_term_frequency_dict)

    @staticmethod
    def __split_unit_texts(
            utterance_objects: List[UtteranceObject],
            limit_char_count: int
    ) -> List[str]:

        unit_texts: List[str] = []
        unit_text: str = ''
        for utterance_object in utterance_objects:
            if len(unit_text + ' ' + utterance_object['utterance']) <= limit_char_count:
                unit_text += ' ' + utterance_object['utterance']

            else:
                unit_texts.append(unit_text.strip())
                unit_text = utterance_object['utterance']
        if len(unit_text) > 0:
            unit_texts.append(unit_text.strip())

        return unit_texts

    # @staticmethod
    # def __split_unit_texts(
    #         sentences: List[str],
    #         limit_char_count: int
    # ) -> List[str]:
    #
    #     unit_texts: List[str] = []
    #     unit_text: str = ''
    #     for sentence in sentences:
    #         if len(unit_text + ' ' + sentence) <= limit_char_count:
    #             unit_text += ' ' + sentence
    #             # if len(unit_text) == 0:
    #             #     unit_text += sentence
    #             # elif unit_text[len(unit_text) - 1] == '.' \
    #             #         or unit_text[len(unit_text) - 1] == '?':
    #             #     unit_text += ' ' + sentence
    #             # else:
    #             #     unit_text += sentence
    #
    #         else:
    #             unit_texts.append(unit_text.strip())
    #             unit_text = sentence
    #     if len(unit_text) > 0:
    #         unit_texts.append(unit_text.strip())
    #
    #     return unit_texts

    @staticmethod
    def __analyze_aiopen_nlu(unit_texts: List[str], access_key: str) -> Any:

        sentence_objects_of_aiopen: List = []

        for unit_text in unit_texts:
            request_json = {
                "access_key": access_key,
                "argument": {
                    "text": unit_text,
                    "analysis_code": "morp"
                }
            }

            http = urllib3.PoolManager()
            response = http.request(
                "POST",
                "http://aiopen.etri.re.kr:8000/WiseNLU_spoken",
                headers={"Content-Type": "application/json; charset=UTF-8"},
                body=json.dumps(request_json)
            )

            result = json.loads(str(response.data, "utf-8"))
            sentence_objects_of_aiopen = sentence_objects_of_aiopen + \
                result['return_object']['sentence']

        for sentence_object in sentence_objects_of_aiopen:
            sentence_object['id'] = int(sentence_object['id'])
            for morp in sentence_object['morp']:
                morp['id'] = int(morp['id'])
                morp['position'] = int(morp['position'])

            for word in sentence_object['word']:
                word['begin'] = int(word['begin'])
                word['end'] = int(word['end'])
                word['id'] = int(word['id'])

        return sentence_objects_of_aiopen

    @staticmethod
    def __make_singleterm_frequency_dict(
            sentence_objects_of_aiopen: List[SentenceObjectOfAiopen],
            stopword_dict: dict
    ) -> Dict[str, int]:
        term_frequency_dict: Dict[str, int] = {}

        for sentence_object in sentence_objects_of_aiopen:
            morps = sentence_object['morp']

            for morp in morps:
                if (check_noun_condition(morp['type'])) \
                        and check_term_condition(morp['lemma'], stopword_dict):
                    if morp['lemma'] in term_frequency_dict:
                        term_frequency_dict[morp['lemma']] += 1
                    else:
                        term_frequency_dict[morp['lemma']] = 1

        return term_frequency_dict

    @staticmethod
    def __make_compoundterm_frequency_dict(
            sentence_objects_of_aiopen: List[SentenceObjectOfAiopen],
            stopword_dict: dict
    ) -> Dict[str, int]:
        term_frequency_dict: Dict[str, int] = {}

        for sentence_object in sentence_objects_of_aiopen:
            morps = sentence_object['morp']
            words = sentence_object['word']

            for word in words:
                compound_term: str = ''

                for i in range(int(word['begin']), int(word['end'] + 1)):
                    morp = morps[i]

                    if check_noun_condition(morp['type']):
                        compound_term += morp['lemma']

                    if not check_noun_condition(morp['type']) or i == word['end']:
                        if check_term_condition(compound_term, stopword_dict):
                            if compound_term in term_frequency_dict:
                                term_frequency_dict[compound_term] += 1
                            else:
                                term_frequency_dict[compound_term] = 1
                        compound_term = ''

                # print('word', word)
                # print('term_frequency_dict', term_frequency_dict)

        return term_frequency_dict

    @staticmethod
    def __make_keyterm_objects(term_frequency_dict: Dict[Any, int], term_list: List[str],
                               standard_high_frequency: int) -> List:
        keyterm_occurrence_dict = dict(
            filter(lambda term_tuple: term_tuple[1] >= standard_high_frequency,
                   term_frequency_dict.items()))
        keyterm_dict = {}
        for index, term in enumerate(term_list):
            if term in keyterm_occurrence_dict:
                keyterm_dict[term] = {
                    "name": term,
                    "frequency": keyterm_occurrence_dict[term],
                    "index": index
                }
        keyterm_objects: List = sorted(keyterm_dict.values(), key=(
            lambda keyterm_object: keyterm_object['index']))

        return keyterm_objects

    @staticmethod
    def __make_frequency_vector(
            term_list: List[str],
            term_frequency_dict: Dict[str, int]
    ) -> List[int]:
        return list(map(lambda term: term_frequency_dict[term], term_list))

    @property
    def sentence_objects_of_aiopen(self):
        return self.__sentence_objects_of_aiopen

    @property
    def single_term_list(self):
        return self.__single_term_list

    @property
    def single_keyterm_objects(self):
        return self.__single_keyterm_objects

    @property
    def single_frequency_vector(self):
        return self.__single_frequency_vector

    @property
    def compound_term_list(self):
        return self.__compound_term_list

    @property
    def compound_keyterm_objects(self):
        return self.__compound_keyterm_objects

    @property
    def compound_frequency_vector(self):
        return self.__compound_frequency_vector
