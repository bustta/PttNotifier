#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Author: bustta
# @Date:   2015-01-20 23:46:46
# @Last Modified by:   bustta
# @Last Modified time: 2015-02-02 00:50:27

import os
import psycopg2
from Util import Util


class PGDataDriver():

    def __init__(self):
        super(PGDataDriver, self).__init__()
        self.conn = None
        self.util = Util()

    def open_pg_connection(self):
        try:
            self.conn = psycopg2.connect(
                database=os.environ['PTTNOTIFIER_DB'],
                user=os.environ['PTTNOTIFIER_DB_DEFAULT_USER'],
                password=os.environ['PTTNOTIFIER_DB_DEFAULT_PASSWORD'],
                host=os.environ['PG_HOST_IP'], port=os.environ['PG_PORT'])
        except Exception:
            self.conn = None
            self.util.log_exception()
            raise

        return self.conn

    def close_pg_connection(self):
        self.conn.close()
        self.conn = None

    def get_pg_cursor(self):
        return self.conn.cursor()

    def execute_and_fetchall(self, sql, cur):
        cur.execute(sql)
        return cur.fetchall()

    def execute(self, sql, cur):
        try:
            cur.execute(sql)
        except Exception:
            self.util.log_exception()
            raise


