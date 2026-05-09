question_prompt_template = """Please summarize the previous messages in the conversation while preserving their content in the form of a final question so that we can use it to extract relevant documents for the previous questions.
Please Return the question as is if no usefull information is present or the question is not reffering to the previous messages.
DO NOT Answer The Question Under Any Circumstances. DO NOT Change the meaning of the base question in the refined form.
Base Question: {question}
Refined Question: """
prompt_template = """Instruction: You are an AI assistant for question-answering task. \
        Use the following pieces of retrieved context if needed to answer the question. \
        There is a given context gathered from some research papers. \
        Also maybe there are some meta-data from the research papers that we extracted the context from them. \
        You can point to a research paper according to meta-datas like the author, title, and abstraction provided to help the user to get more information from it. \
        Assume that your knowledge is limited to the given context and answer the question. \
        DO NOT say anything that is not present in the context. \
        Answers MUST BE in Persian. \
                
        Basic Knowledge: {knowledge}

        Context: {context}

        Meta-Data: {metadata}

        ### Conversation ###
        Question: {question}
        Answer: """

only_context_prompt_template = """Instruction: You are an AI assistant for question-answering task. \
        Use the following pieces of retrieved context if needed to answer the question. \
        There is a given context gathered from some research papers. \
        Assume that your knowledge is limited to the given context and answer the question. \
        DO NOT say anything that is not present in the context. \
        Answers MUST BE in Persian. \
                
        Basic Knowledge: {knowledge}

        Context: {context}

        ### Conversation ###
        Question: {question}
        Answer: """

only_metadata_prompt_template = """Instruction: You are an AI assistant for question-answering task. \
        Use the following pieces of retrieved context if needed to answer the question. \
        There is a given context gathered from some research papers. \
        Also maybe there are some meta-data from the research papers that we extracted the context from them. \
        You can point to a research paper according to meta-datas like the author, title, and abstraction provided to help the user to get more information from it. \
        Assume that your knowledge is limited to the given context and answer the question. \
        DO NOT say anything that is not present in the context. \
        Answers MUST BE in Persian. \


        Context: با توجه به متاداده ها پاسخ بده

        Meta-Data: {metadata}

        ### Conversation ###
        Question: {question}
        Answer: """
no_rag_prompt_template = """Instruction: You are an AI assistant for question-answering task. \
                                         In answer simply say: "لطفا یکی از موارد استفاده از اسناد یا متاداده ها را روشن کنید". \
                                         
        ### Conversation ###
        Answer: """
        
retrieval_evaluator_prompt_template= 'Is the question answered by the following context? Say "Yes" or "No"\n\nContext: {context}\n\nQuestion: {question} ###Response'
