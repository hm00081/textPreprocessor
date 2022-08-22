# -*- coding:utf-8 -*-
import json
import codecs

from classes.term_analyzer import TermAnalyzer

path_of_access_key_dict = '../access_keys/accessKeyDict.json'

# TODO Select debate name
# debate_name = 'sample'
# debate_name = '기본소득'
# debate_name = '기본소득clipped'
# debate_name = '정시확대'
# debate_name = '정시확대clipped'
# debate_name = '모병제'
debate_name = '지방소멸'
#debate_name = '모병제clipped'
# debate_name = "집값"
# debate_name = "정년연장"

# TODO constants
standard_high_frequency = 5

# paths
path_of_utterance_objects = '../data/{}/utterance_objects.json'.format(
    debate_name)
# path_of_only_utterances_text = "../data/{}/only_utterances_text.txt".format(
#     debate_name)
path_of_stopword = '../data/{}/stopword_dict.json'.format(debate_name)
path_of_sentence_objects_of_aiopen = '../data/{}/sentence_objects_of_aiopen.json'.format(
    debate_name)
path_of_single_term_list = '../data/{}/single_term/term_list.json'.format(
    debate_name)
path_of_single_frequency_vector = '../data/{}/single_term/frequency_vector.json'.format(
    debate_name)
path_of_single_term_utterance_boolean_matrix = '../data/{}/single_term/term_utterance_boolean_matrix.json'.format(
    debate_name)
path_of_single_keyterm_objects_path = '../data/{}/single_term/keyterm_objects.json'.format(
    debate_name)
path_of_compound_term_list = '../data/{}/compound_term/term_list.json'.format(
    debate_name)
path_of_compound_frequency_vector = '../data/{}/compound_term/frequency_vector.json'.format(
    debate_name)
path_of_compound_term_utterance_boolean_matrix = '../data/{}/compound_term/term_utterance_boolean_matrix.json'.format(
    debate_name)
path_of_compound_keyterm_objects_path = '../data/{}/compound_term/keyterm_objects.json'.format(
    debate_name)

# read files
utterance_objects = json.load(codecs.open(
    path_of_utterance_objects, encoding='utf-8-sig'))
# only_utterances_text = codecs.open(
#     path_of_only_utterances_text, encoding='UTF-8-sig').read()
stopword_dict = json.load(codecs.open(path_of_stopword, encoding='utf-8-sig'))
access_key_dict = json.load(codecs.open(
    path_of_access_key_dict, encoding='UTF-8-sig'))
aiopen_access_key = access_key_dict['aiopen']


morpAnalyzer = TermAnalyzer(utterance_objects,
                            stopword_dict, aiopen_access_key, standard_high_frequency)


# write files
with open(path_of_sentence_objects_of_aiopen, 'w', encoding='utf-8-sig') as file:
    file.write(json.dumps(
        morpAnalyzer.sentence_objects_of_aiopen, ensure_ascii=False))
    print("'{}' is made.".format(path_of_sentence_objects_of_aiopen))

# write single_term
with open(path_of_single_term_list, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.single_term_list, ensure_ascii=False))
    print("'{}' is made.".format(path_of_single_term_list))
with open(path_of_single_keyterm_objects_path, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.single_keyterm_objects, ensure_ascii=False))
    print("'{}' is made.".format(path_of_single_keyterm_objects_path))
with open(path_of_single_frequency_vector, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.single_frequency_vector, ensure_ascii=False))
    print("'{}' is made.".format(path_of_single_frequency_vector))

# write compound_term_list.json
with open(path_of_compound_term_list, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.compound_term_list, ensure_ascii=False))
    print("'{}' is made.".format(path_of_compound_term_list))
with open(path_of_compound_keyterm_objects_path, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.compound_keyterm_objects, ensure_ascii=False))
    print("'{}' is made.".format(path_of_compound_keyterm_objects_path))
with open(path_of_compound_frequency_vector, 'w', encoding='UTF-8-sig') as file:
    file.write(
        json.dumps(morpAnalyzer.compound_frequency_vector, ensure_ascii=False))
    print("'{}' is made.".format(path_of_compound_frequency_vector))

print('process end')
